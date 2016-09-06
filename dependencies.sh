# dependencies are installed here
cd js-lib/

# removing links if any
rm js-lib/MincReaderJS
rm js-lib/VolumeNavigator

# cloning dependencies (dev versions)
git clone https://github.com/jonathanlurie/VolumeNavigator.git
git clone https://github.com/jonathanlurie/MincReaderJS.git

# cleaning the .git folders of dependencies
rm -rf VolumeNavigator/.git
rm -rf MincReaderJS/.git
