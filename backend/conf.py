import os
import logging


auth_pubkey_fpath = os.path.join(os.path.expanduser('~'), '.ssh/id_rsa.pub')
auth_pubkey = open(auth_pubkey_fpath).read().strip()

port = 6561
