const fs = require('fs');
const request = require('request');
const changes = require('concurrent-couch-follower');

const db = 'https://replicate.npmjs.com';
const packages_dir = 'packages/';

if (!fs.existsSync(packages_dir)) {
	fs.mkdirSync(packages_dir)
}

var dataHandler = function(data, done) {

	if (data.doc.name) { // ignore seq_updates that aren't package updates

		// update a counter to track progress
		if (data.seq % 1000 == 0) {
			console.log(data.seq);
		}

		// get package name, replace /'s with ~'s to avoid invalid file directory names
		let package_name = data.id.replace(/\//g, '~');

		if (package_name.includes('*')) {
			done();
			return;
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

		// create a directory for this package if one does not already exist
		if (!fs.existsSync(packages_dir + package_name)) {
			fs.mkdirSync(packages_dir + package_name);
		}

		let tarball_url = version_metadata['dist']['tarball'];
		let tarball_path = packages_dir + package_name + '/' + latest_version + '.tgz';
		let metadata_path = packages_dir + package_name + '/' + latest_version + '.metadata';

		// skip versions that are already downloaded (this occurs when a single version is given multiple dist-tags)
		if (!fs.existsSync(tarball_path)) {

			// save metadata to a file
			fs.writeFile(metadata_path, JSON.stringify(version_metadata), (error) => {
				if (error) {
					console.log(error);
				}
			});

			// download source code
			let tarball_file = fs.createWriteStream(tarball_path);
			request(tarball_url)
				.pipe(tarball_file)
				.on('error', (error) => {
					console.log(package_name, error);
				}
			);

		}
	}

	done();
};

var config = {
	db: db,
	include_docs: true,
	concurrency: 1
}

changes(dataHandler, config)
