module.exports = function(grunt) {
	var sources = grunt.file.readJSON("sources.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		concat: {
			options: {
				banner: "(function(Phaser) {\n",
				separator: "\n",
				footer: "\n})(Phaser);"
			},
			dist: {
				src: sources,
				dest: "dist/<%= pkg.name %>.js"
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");

	grunt.registerTask("default", ["concat"]);
};