module.exports = function(grunt) {
	var sources = grunt.file.readJSON("sources.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		watch: {
			all: {
				files: "./src/**",
				options: {
					livereload: true,
					interval: 1500
				},
				tasks: ["default"]
			}
		},

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

	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-concat");

	grunt.registerTask("default", ["concat"]);
	grunt.registerTask("devwatch", ["concat", "watch"]);
};
