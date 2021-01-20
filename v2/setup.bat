setlocal enableextensions enabledelayedexpansion
call npm i
cd client
call npm i
cd ..
md "%USERPROFILE%\.slidechat\files"
call npm run build
echo You are all almost done! Check out our GitHub Wiki for how to deploy this app or start developing.
