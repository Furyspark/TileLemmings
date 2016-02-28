module.exports = function(grunt) {
	var sources = grunt.file.readJSON("sources.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		shell: {
      electron: {
        command: "electron ."
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
				dest: "game.js"
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-shell");

	grunt.registerTask("test", ["concat"]);
};
