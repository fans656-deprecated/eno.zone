from f6 import loc

loc(excludes=lambda path, fname: 'node_modules' in path or 'build' in path)
