const fs = require('fs')

module.exports = function (api) {
    if (process.env.NODE_ENV === 'production') return
    const tree = require('../../../temp/pagesTrees.json')
    // List of all pages in development
    api.loadSource(({getCollection}) => {
        const sitemap = []
        function getNodes(nodes = []){
            for (let node of nodes){
                sitemap.push({
                    path: node.path
                })
                if (node.children?.length) {
                    getNodes(node.children)
                }
            }
        }
        getNodes(tree)
        fs.writeFileSync('static/sitemap.dev.json',
            JSON.stringify(sitemap, null, 2),
            {encoding:"utf-8"})
    })
}
