const fs = require('fs');
const request = require('request');
const changes = require('concurrent-couch-follower');

const db = 'https://replicate.npmjs.com';
const packages_dir = 'packages/';

var dataHandler = function(data, done) {

	if (data.doc.name) { // ignore seq_updates that aren't package updates

		// update a counter to track progress
		if (data.seq % 1000 == 0) {
			console.log(data.seq);
		}

		// get package name, replace /'s with ~'s to avoid invalid file directory names
		let package_name = data.id.replace(/\//g, '~');

		// create a directory for this package if one does not already exist
		if (!fs.existsSync(packages_dir + package_name)) {
			fs.mkdirSync(packages_dir + package_name);
		}

		// return if the package has zero versions available
		if (Object.keys(data.doc.versions).length == 0) {
			done();
			return;
		}

		// get latest version of the package (not always the one with the 'latest' dist-tag)
		let time = data.doc['time'];
		let latest_version = '';

		for (version in time) {
			if (version == 'created' || version == 'modified') {
				continue;
			}

			if (latest_version == '') {
				latest_version = version;
			} else if (time[version] > time[latest_version]) {
				latest_version = version;
			}
		}

		// check if we successfully found the latest version
		if (latest_version == '') {
			console.log('Error: could not find latest version of', package_name);
			done();
			return;
		}


		// get the latest version's metadata
		let version_metadata = data.doc['versions'][latest_version];

		// return if the latest version has been removed by NPM
		if (!version_metadata) {
			done();
			return;
		}

		let tarball_url = version_metadata['dist']['tarball'];
		let tarball_path = packages_dir + package_name + '/' + latest_version + '.tgz';
		let metadata_path = packages_dir + package_name + '/' + latest_version + '_metadata';

		// skip versions that are already downloaded (this occurs when a single version is given multiple dist-tags)
		if (!fs.existsSync(tarball_path)) {
			//writing the metadata a file in the folder labeled versionNum_metadata as long as it doesn't exist already
			if(!fs.existsSync(metadata_path)){ 
				fs.mkdirSync(metadata_path, (err, folder) => {
					fs.writeFile(metadata_path + '/' + 'metadata.txt', version_metadata, (err) => {
						if(err) {
							console.log("Error writing metadata of " + version_metadata.name + " to file")
						} else {
							console.log("Wrote metadata of "+ version_metadata.name + " to file");
						}
					});
				});
			}

			// download file located at tarball_url
			// let req = request(tarball_url);
			// req.on('response', (res) => {
			// 	res.pipe(fs.createWriteStream(tarball_path));
			// });
		}
	}

	done();
};

var config = {
	db: db,
	include_docs: true,
	concurrency: 5
}

changes(dataHandler, config)
