const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const args = process.argv

if (args.length < 3) {
	console.err("Require one Argument")
	process.exit(1)
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

	return `digraph G {
${edges(parentMap)}
${isolated()}
}`
}
