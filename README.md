# xcode2make
An attempt to create a script to convert an xcode project, into a makefile(s)

## Why? 
I was bored, and I like to do React-native development - I don't own a Mac when I'm at university, and I had used the theos toolchain on Windows before to build iOS apps for Jailbroken devices. 
This made me wonder if it was possible to build a React-Native app on Windows for iOS, and somehow I ended up here, writing a script that had a general aim to take a xcode project, and convert it into a makefile. 

## Does it work? 
No(t really). 

It certainly doesn't build an app, and probably won't even work in the slighest for anything that isn't the React Libraries. Even then, I (so far) have only got it to build the supporting shared Libraries (ie: libART.a, etc ) and not even the main libReact.a, and I haven't even started looking at targetting and packaging the app. 

## Can I contribute? 
If you want, the code is awful - and certainly needs a clean-up. With React introducing [Create React Native App] (https://facebook.github.io/react-native/blog/2017/03/13/introducing-create-react-native-app.html), I'm not sure how motivated I am to continue with this project, and am simply sharing this in-case anybody thinks to do a similiar thing. 

## Dependencies 
I used [Theos](https://github.com/theos/theos), installed on Windows Linux using the theos install script [here](https://github.com/supermamon/install-theos). Also you'll need NodeJS and need to run npm install.  


