module.exports = function(grunt) {
	var sources = grunt.file.readJSON("sources.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		shell: {
			electron: {
				command: "electron ."
			},
			nw: {
				command: "nw ."
			}
		},

		concat: {
			test: {
				options: {
					banner: "(function(Phaser, io) {\n",
					separator: "\n",
					footer: "\n})(Phaser, io);"
				},
				src: sources,
				dest: "game.js"
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-shell");

	grunt.registerTask("test", ["concat:test", "shell:nw"]);
};
