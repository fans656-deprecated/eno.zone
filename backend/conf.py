import os
import re


user_home_path = os.path.expanduser('~')
ssh_dir_path = os.path.join(user_home_path, '.ssh')

auth_pubkey_fpath = os.path.join(ssh_dir_path, 'id_rsa.pub')
auth_pubkey = open(auth_pubkey_fpath).read().strip()

auth_prikey_fpath = os.path.join(ssh_dir_path, 'id_rsa')
auth_prikey = open(auth_prikey_fpath).read().strip()

port = 9000

default_avatar_url = '/res/eno.zone/avatar/default.jpg'

username_max_length = 128
password_max_length = 128

valid_username_regex = re.compile('[-._a-zA-Z0-9]+')

datetime_format = '%Y-%m-%d %H:%M:%S.%s UTC'

reserved_usernames = (
    'root',
    'admin',
)

debug = os.path.exists('./DEBUG')

owner = 'fans656'
