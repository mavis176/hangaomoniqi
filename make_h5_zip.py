import os
import zipfile

# 1. Create H5 Game Platform Upload Package (Pure dist contents at root)
def create_h5_upload_zip(dist_dir, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Save relative to dist_dir so index.html is at root of the zip
                arcname = os.path.relpath(file_path, dist_dir)
                zipf.write(file_path, arcname)
    print(f"H5 upload zip created: {output_path}")

# 2. Create Full Source Code Package
def create_source_zip(output_path):
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
    print(f"Full source zip created: {output_path}")

if __name__ == '__main__':
    create_h5_upload_zip('dist', '/tmp/h5_game_upload.zip')
    create_source_zip('/tmp/full_source_code.zip')
