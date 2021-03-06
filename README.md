# Visualizing yaml files dependencies

Many people rely on yaml files to do the production deployment. However, a large project might have numerous config yamls and the dependencies might be confusing to reason about.

This tool is looking for yaml files with the `extends` field, and generate a tree graph to represent the dependencies. The tree graph is represented by [the dot language](https://graphviz.gitlab.io/_pages/doc/info/lang.html).

Requirement: [graphviz](http://www.graphviz.org/) installed

# Usage

Sample command:
```
node index.js ./test_dir | dot -Tsvg > yaml_tree.svg
```

If provided with two arguments, the second argument should be one of the yaml file in the designated directory. it will only generate the tree graph with this node and all its parents.

Sample command:
```
node index.js ./test_dir ./test_dir/test_dir_2/f.yaml | dot -Tsvg > yaml_sub_tree.svg
```


# Executable is included in the repo

I used this amazing tool to create the executable: [nexe](https://github.com/nexe/nexe)
Just do:
```
nexe index.js
```

If there is a bug during executable generation, refer to this [issue](https://github.com/nexe/nexe/issues/585)

There are also some executable-generation tools, for example [pkg](https://github.com/zeit/pkg), however this tool does not fit with my use case. Because pkg has its own internal file system, which works not perfectly with the actual file system on the machine.


