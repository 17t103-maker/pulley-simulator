const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/physics.js':'physics.js','/app.js':'app.js'};
http.createServer((req,res)=>{const file=files[req.url.split('?')[0]];if(!file){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript');res.end(fs.readFileSync(path.join(__dirname,file)));}).listen(8765,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8765'));
