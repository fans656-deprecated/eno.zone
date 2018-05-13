import re
import os
import json
import urlparse
import multiprocessing
import subprocess
import itertools
import traceback

import requests
import flask
from pyquery import PyQuery
from f6 import each

import conf
import docer
import util
from util import success_response, error_response
import user_util


__all__ = (
    'get_blogs',
    'get_blog',
    'post_blog',
    'put_blog',
    'del_blog',

    'post_comment',
    'get_comments',
    'delete_comment',
)


def get_blogs():
    page = int(flask.request.args.get('page', 1))
    size = int(flask.request.args.get('size', 20))
    query_str = flask.request.args.get('q', '')
    if query_str:
        searches = [
            {'tag': query_str},
            {'content': query_str},
        ]
    else:
        searches = [{}]
    searches = [guard_search_with_access_control(s) for s in searches]
    query = {
        'page': page,
        'size': size,
        'search': searches
    }
    r = docer.get_docs(query)
    return success_response({
        'blogs': r['docs'],
        'pagination': make_pagination(r['docs'], page, size, r['total'])
    })


def get_blog(blog_id):
    doc = docer.get_doc(blog_id)
    if doc:
        return success_response({'blog': doc})
    else:
        return error_response('not found', 404)


@user_util.require_owner_login
def post_blog():
    doc = flask.request.json
    if docer.put_doc(doc):
        return success_response()
    else:
        return error_response('post error')


@user_util.require_owner_login
def put_blog(blog_id):
    blog = flask.request.json
    blog['id'] = blog_id
    if docer.put_doc(blog):
        return success_response()
    else:
        return error_response('put error')


@user_util.require_owner_login
def del_blog(blog_id):
    if docer.del_doc(blog_id):
        return success_response()
    else:
        return error_response('delete error')


def get_comments(blog_id):
    doc = docer.get_doc(blog_id)
    return success_response({
        'comments': doc.get('comments', [])
    })


def post_comment(blog_id):
    doc = docer.get_doc(blog_id)
    if not doc:
        return error_response('doc not found', 404)

    comment = flask.request.json
    if 'user' in comment:
        username = comment['user']['username']
    else:
        username = comment['visitorName']
    if 'comments' not in doc:
        doc['comments'] = []
    comment = {
        'username': username,
        'content': comment['content'],
        'ctime': util.utcnow(),
        'id': max([c['id'] for c in doc['comments']] + [0]) + 1
    }
    doc['comments'].append(comment)

    if docer.put_doc(doc):
        return success_response()
    else:
        return error_response('post comment error')


@user_util.require_owner_login
def delete_comment(doc_id, comment_id):
    doc = docer.get_doc(doc_id)
    if not doc:
        return error_response('doc not found', 404)
    comments = doc.get('comments', [])
    try:
        i_comment = next(i for i, c in enumerate(comments)
                         if c['id'] == comment_id)
    except StopIteration:
        return error_response('comment not found', 404)
    del comments[i_comment]
    if docer.put_doc(doc):
        return success_response()
    else:
        return error_response('del comment error')


def search():
    args = flask.request.json

    by = args['by']
    match = args['match']

    if by == 'tags' and match == 'partial':
        return response_blogs_by_tags(args.get('tags', []))
    return error_response('unsupported by={}'.format(data['by']))


def make_pagination(blogs, page, size, total):
    return {
        'page': page,
        'size': len(blogs),
        'total': total,
        'nPages': (total / size) + (1 if total % size else 0),
    }


def parse_content(content, blog_id):
    lines = [l.strip() for l in content.split('\n')]
    for line in lines:
        if not line:
            break
        # leetcode
        try:
            m = re.match(r'\[_\]: (.*) ?(.*)?', line)
            url = m.group(1)
            meta = m.group(2)
            if url.startswith('https://leetcode.com/problems/'):
                p = multiprocessing.Process(
                    target=get_leetcode_problem,
                    args=(url, blog_id)
                )
                p.start()
        except Exception as e:
            traceback.print_exc()
            continue
        # txt
        try:
            m = re.match(r'\[_\]: ([^ ]*).*', line)
            url = m.group(1)
            path = urlparse.urlparse(str(url)).path
            path = urlparse.unquote(path).decode('utf8')
            is_txt_file = path.startswith('/file') and path.endswith('.txt')
            if is_txt_file:
                attrs = {
                    'name': os.path.splitext(os.path.basename(path))[0],
                    'encoding': 'utf8',
                }
                user_attrs, description = get_attrs_and_description(lines)
                attrs.update(user_attrs)
                db.query('match (blog:Blog{id: {id}}) set blog.type = "txt", '
                         'blog.path = {path}, '
                         'blog.attrs = {attrs}, '
                         'blog.description = {description}', {
                             'id': blog_id,
                             'path': path,
                             'attrs': json.dumps(attrs),
                             'description': description,
                         })
        except Exception as e:
            traceback.print_exc()
            continue


def get_attrs_and_description(lines):
    lines = lines[2:]
    if lines[0] == '{':
        try:
            i_endline = next(i for i, l in enumerate(lines) if l == '}')
            attrs_lines = lines[:i_endline+1]
            description_lines = lines[i_endline+2:]
            return (json.loads('\n'.join(attrs_lines)),
                    '\n'.join(description_lines))
        except StopIteration:
            pass
    return {}, '\n'.join(lines)


def get_leetcode_problem(url, blog_id):
    raw_page = subprocess.check_output('curl -s ' + url, shell=True)
    d = PyQuery(raw_page)
    title_text = d('.question-title h3').text()
    description = d('.question-description').html()
    db.query('match (blog:Blog{id: {id}}) '
             'set blog.leetcode = {leetcode}', {
                 'id': blog_id,
                 'leetcode': json.dumps({
                     'url': url,
                     'title': title_text,
                     'description': description,
                 })
    })


def guard_search_with_access_control(search):
    if user_util.is_owner():
        return search
    else:
        return {
            'and': [
                {'tag': {'not': '.'}},
                search,
            ]
        }


if __name__ == '__main__':
    #from pprint import pprint
    post_comment(1246)
