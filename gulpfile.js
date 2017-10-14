var gulp = require("gulp");
var gulpConcat = require("gulp-concat");
var exec = require("child_process").exec;
var fs = require("fs");
var yaml = require("js-yaml");

function buildClient(platform, arch) {
  exec("electron-packager . tile-lemmings --overwrite --platform=" + platform + " --arch=" + arch + " --out=dist --electron-version=1.6.6 --prune " +
  "--ignore=.gitignore --ignore=Readme.md --ignore=save.json --ignore=.atom-build.json --ignore=config.json --ignore=gulpfile.json --ignore=src " +
  "--ignore=workplace", function(error, stdout, stderr) {
    if(error) console.log(error);
    else console.log("Done building for " + platform + " " + arch + "!");
  });
}

function getCompileData() {
  let data = yaml.load(fs.readFileSync("compile-data.yaml"));
  for(let appType in data) {
    data[appType].sources = data[appType].sources.map(function(filename) {
      return data[appType].baseDir + filename;
    });
  }
  return data;
};

gulp.task("build-app", function() {
  let compileData = getCompileData();
  console.log(compileData.app.sources);
  gulp.src(compileData.app.sources)
    .pipe(gulpConcat(compileData.app.target.fn))
    .pipe(gulp.dest(compileData.app.target.dir));
});

gulp.task("build-electron", function() {
  buildClient("linux,win32", "x64,ia32");
});

gulp.task("default", ["build-app"]);

gulp.task("compile", ["client", "build-electron"]);
