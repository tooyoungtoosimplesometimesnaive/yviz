const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const args = process.argv

let allNodesMode = true
let interestedNode = ''

if (args.length < 3) {
	console.err("Require at least one Argument")
	process.exit(1)
}

if (args.length == 4) {
	allNodesMode = false
	interestedNode = path.resolve(__dirname, args[3])
}

const dirRoot = path.resolve(__dirname, args[2])

// fs.readdir(dirRoot, (err, list) => console.log(list))
const all = allFiles(dirRoot)
const usedFiles = new Set()
const map = parentMap(all)
// console.log(map)

console.log(generateDotFile(map))

/*
 * Get all the files' absolute path
 */
function allFiles(dirRoot) {
	const files = []
	const list = fs.readdirSync(dirRoot)
	list.forEach(l => {
		const p = path.join(dirRoot, l)
		const stat = fs.statSync(p)
		if (stat.isDirectory()) {
			allFiles(p).forEach(pp => files.push(pp))
		} else {
			files.push(p)
		}
	})
	return files
}

/*
 * Return a map, key: parent, value: child
 */
function parentMap(filePathList) {
	function parse(filePath) {
		const y = yaml.safeLoad(fs.readFileSync(filePath))
		if (y && y['extends']) {
			return y['extends'].map(d => path.join(path.parse(filePath).dir, d))
		} else {
			return []
		}
	}

	resultMap = {}
	filePathList.forEach(filePath => {
		const parents = parse(filePath)
		parents.forEach(parentFile => {
			if (parentFile in resultMap) {
				resultMap[parentFile].push(filePath)
			} else {
				resultMap[parentFile] = [filePath]
			}
		})
	})
	return resultMap
}

function relatedNodes(parentMap, interestedNode) {
	function reverseParentMap(parentMap) {
		// key: child, value: list of parents
		const childMap = {}
		Object.keys(parentMap).forEach(p => {
			parentMap[p].forEach(child => {
				if (child in childMap) {
					childMap[child].push(p)
				} else {
					childMap[child] = [p]
				}
			})
		})
		return childMap
	}
	function getParents(n, childMap, pathSet) {
		pathSet.add(n)
		const parents = childMap[n]
		if (parents) {
			parents.forEach(p => {
				getParents(p, childMap, pathSet)
			})
		}
	}

	const s = new Set()
	const childMap = reverseParentMap(parentMap)
	getParents(interestedNode, childMap, s)
	return s
}

function generateDotFile(parentMap){

	function name(absolutePath) {
		return path.relative(dirRoot, absolutePath)
	}

	function edges(pMap) {
		let str = ''

		Object.keys(pMap).forEach(p => {
			usedFiles.add(p)
			const v = pMap[p]
			v.forEach(child => {
				usedFiles.add(child)
				const edge = `"${name(p)}" -> "${name(child)}";\n`
				str += edge
			})
		})
		return str
	}

	function isolated() {
		return all.filter(f => !usedFiles.has(f)).map(f => `"${name(f)}"`).join('\n')
	}

	function edges2(pMap, relatedNodesSet) {
		let str = ''
		Object.keys(pMap).forEach(p => {
			const v = pMap[p]
			v.forEach(child => {
				if (relatedNodesSet.has(child) && relatedNodesSet.has(p)) {
					str += `"${name(p)}" -> "${name(child)}";\n`
				}
			})
		})
		return str
	}

	if (allNodesMode) {
		return `digraph G {
${edges(parentMap)}
${isolated()}
}`
	} else {
		const relatedNodesSet = relatedNodes(parentMap, interestedNode)
		if (relatedNodesSet.size == 1) {
			return `digraph G { ${name(interestedNode)} }`
		} else {
			return `digraph G {
${edges2(parentMap, relatedNodesSet)}
}`
		}
	}
}
