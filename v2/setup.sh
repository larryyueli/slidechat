npm i
cd client && npm i && cd ..
cd instructor-client && npm i && cd ..

# default location to store pdf files
mkdir -p ~/.slidechat/files

npm run build

echo
echo 'You are all almost done! Check out our GitHub Wiki for how to deploy this app or start developing.'
