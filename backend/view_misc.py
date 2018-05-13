import os
import json
import traceback

import flask
from PIL import Image
from f6 import each

import conf
import util
import view_blog
from util import success_response, error_response


def get_static(path):
    return util.send_from_directory(conf.FRONTEND_BUILD_DIR, 'static', path)


def get_file(path):
    args = flask.request.args
    if len(args):
        width = int(args.get('width', 0))
        height = int(args.get('height', 0))
        if width or height:
            try:
                fpath = util.rooted_path(conf.FILES_ROOT, path)
                im = Image.open(fpath)
                img_width, img_height = im.size
                if width and not height:
                    height = int(width / float(img_width) * img_height)
                elif height and not width:
                    width = int(height / float(img_height) * img_width)
                width = min(width, img_width)
                height = min(height, img_height)
                im = im.resize((width, height), Image.ANTIALIAS)
                dirname = os.path.dirname(fpath)
                fname = os.path.basename(fpath)
                fname = 'tmp-' + fname
                fpath = os.path.join(dirname, fname)
                im.save(fpath)
                return flask.send_file(fpath)
            except Exception:
                traceback.print_exc()
    return util.send_from_directory(conf.FILES_ROOT, path)


def no_such_api(path):
    return error_response('no such api', 404)


def get_custom_url(path):
    if not path:
        return error_response('invalid path')
    if not path.startswith('/'):
        path = '/' + path
    doc = mongodb.doc.find_one({'custom_url': path})
    if not doc:
        return error_response('Oops, not found', 404)
    return success_response({
        'type': 'blog',
        'blog': doc,
    })


import pymongo
mongodb = pymongo.MongoClient().fme


if __name__ == '__main__':
    doc = mongodb.doc.find_one({'custom_url': '/portal'})
    print doc
