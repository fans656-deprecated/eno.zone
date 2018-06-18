from . import storage_local as local
from . import storage_qiniu as qiniu


modules = [
    local,
    qiniu,
]


def get_templates():
    return [m.template for m in modules if m]
