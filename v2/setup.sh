cd client
npm i
npm run build

cd ../server
npm i

# default location to store pdf files
mkdir -p ~/.slidechat/files

mkdir react-build
cp ../client/build/* react-build/

npm start
