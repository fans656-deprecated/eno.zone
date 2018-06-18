#import view_user, view_misc
#import view_read, view_gallery, view_leetcode
import view
import stome

endpoints = [
    # login
    ('POST', '/api/login', view.user.post_login),
    ('POST', '/api/signup', view.user.post_signup),

    # profile
    #('POST', '/profile/<username>/avatar', view_user.post_avatar),

    # -------------------------------------------------- view_blog

    # note
    ('GET', '/api/note/<int:note_id>', view.note.get_note),
    ('GET', '/api/note', view.note.get_notes),
    ('POST', '/api/note', view.note.post_note),
    ('PUT', '/api/note/<int:note_id>', view.note.put_note),
    ('DELETE', '/api/note/<int:note_id>', view.note.delete_note),

    ## comment
    ('POST', '/api/note/<int:note_id>/comment', view.note.post_comment),
    ('DELETE', '/api/note/<int:note_id>/comment/<int:comment_id>', view.note.delete_comment),

    ## --------------------------------------------------

    ## read
    #('GET', '/api/read/<int:blog_id>', view_read.get_read),

    ## gallery
    #('POST', '/api/get-gallery', view_gallery.get_gallery),

    ## leetcode-statistics
    #('GET', '/api/leetcode-statistics', view_leetcode.get_statistics),

    ## misc
    #('GET', '/api/custom-url/<path:path>', view_misc.get_custom_url),
    #('GET', '/api/<path:path>', view_misc.no_such_api),

    #('GET', '/static/<path:path>', view_misc.get_static),
    #('GET', '/file/<path:path>', view_misc.get_file),
]

stome_endpoints = {
    stome.views.head_path: [
        ('HEAD', '/res/'),
        ('HEAD', '/res/<path:path>'),
    ],
    stome.views.options_path: [
        ('OPTIONS', '/res/'),
        ('OPTIONS', '/res/<path:path>'),
    ],
    stome.views.get_path: [
        ('GET', '/res/'),
        ('GET', '/res/<path:path>'),
    ],
    stome.views.put_path: [
        ('PUT', '/res/'),
        ('PUT', '/res/<path:path>'),
    ],
    stome.views.post_path: [
        ('POST', '/res/'),
        ('POST', '/res/<path:path>'),
    ],
    stome.views.delete_path: [
        ('DELETE', '/res/'),
        ('DELETE', '/res/<path:path>'),
    ],
}
