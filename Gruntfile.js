module.exports = function(grunt) {
	var sources = grunt.file.readJSON("sources.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		concat: {
			options: {
				banner: "(function(Phaser) {",
				separator: "\n",
				footer: "})(Phaser);"
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