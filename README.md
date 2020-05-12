# Hero Viewer
_A simple app to review character builds made with Mids' Reborn/Pine Hero Designer/Mids' Hero Designer_
_GPL v3.0_

Very basic application to show an overview of your character builds (.mhd files) built with the ElectronJS framework.
As the name suggests, its first goal is to help when you're actually building your character ingame, and will act like a shopping list checker.
But it is _not_ meant to be an editor, so no damage/survivability calculations, no way to change enhancements on-the-fly either.

## Key features
* Quick overview of your character build and enhancements slots
* Add enhancements catalysts and count how many you will need
* Add enhancement boosters and count how many you will need. Note that it only toggles between 0 and +5 levels.
* Review how many enhancements you've already crafted or bought.
* Will attempt to parse builds made with old planners, to some extent.
* No-install and multi-platform (PC only -- no mobile support)
* Completely open database, no binary files but the main executable
* UI made classic html/css + bootstrap CSS library

## Technical specs
This app is built with the [ElectronJS framework](https://electronjs.org/), basically using Chromium for the frontend and NodeJS for the back end.
It will run under Windows, Linux and Mac, 32 or 64 bits systems. No compilation, no extra dependency, it will run out of the box. Tested with ElectronJS 7.1.2 but will most likely run with any higher version.
For compacity of this repository, you will need to download the appropriate ElectronJS framework. See ___Installation___ section for details.
The database version is based upon [Mids' Reborn](https://github.com/Crytilis/mids-reborn-hero-designer/) 2.6.0.7 sources.
For debugging purposes, you can trigger the developer console pressing F12.

## Installation
Install the ElectronJS framework for your system: if you have NodeJS/NPM installed already you can grab it as a npm package. NPM commands are detailed on their [main page](https://electronjs.org/).
For a direct zip package download, get it from [ElectronJS' github](https://github.com/electron/electron/releases/tag/v8.2.5). As of today the latest stable release is 8.2.5. Then pick the one matching your architecture and OS, unpack it anywhere you like.
Get the Hero Viewer application code: on this page, use the "clone or download" button then "download as zip".
Unpack it into __dist/resources/app__ subfolder of your ElectronJS installation (create it if necessary). So when you browse this folder, you should only see a few webpages, JS files, and bootstrap, css, images... subfolders.
Start __electron.exe__ from the __dist__ subfolder. Under *nix platforms it is named __electron__.

## Limitations & known issues
* __VERY__ important: it uses the plain text part of build files only, meaning it won't work with binary-only compressed builds or builds exported to a forum with a data chunk only. If you want to use one of these, you will first need to open it in your planner and re-save it.
* Latest sets and enhancements added to Homecoming are handled but they are not fully functional. E.g. Artillery, Preemptive Optimization and the others will show as common IO sets when they are uncommon and rare.
* You _may_ be able to able old builds, but not those from the era when Fitness was still a pool, not Inherent powers (huh... Issue 12-13 back on live?).  
* Also, enhancement identifiers have changed a lot in between, it is possible to translate to the new ones but the list is hardcoded and most likely incomplete.
* Some powersets have internal aliases, like Street Justice being called Brawling, Bio Armor called Bio-organic Armor, and a few others. There is no guarantee all powersets will load proper. If your build can't load, open the developer console (hit F12) then report the error message shown there.
* Build on test server has a button but is not currently implemented. It is meant for building toons on the beta server, and give a list of boost and boostset commands to get the enhancements you need.
* Load/save config buttons may not work. They are intended to make "snapshots" of what you set in the app but it is only partially implemented.