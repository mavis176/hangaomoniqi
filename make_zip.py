import os
import zipfile

def zip_project(output_path, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {'node_modules', '.git'}
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                file_path = os.path.join(root, file)
                if os.path.abspath(file_path) == os.path.abspath(output_path):
                    continue
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)

if __name__ == '__main__':
    zip_project('/tmp/project_source.zip')
    print('ZIP created successfully with dist')
