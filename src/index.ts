import HTMLParser from "node-html-parser"
import { WebSocket } from "ws"
import https from "https"

const SELECT = "[data-phx-session]:not([data-phx-parent-id])"

const URL_ID_VALIDATION = "https://accounts.ecitizen.go.ke/en/register/citizen/validate-id"

function generateWebSocketURL(crf_token: string): string {
  let WEBSOCKET_URL = "wss://accounts.ecitizen.go.ke/live/websocket"
  //"wss://accounts.ecitizen.go.ke/live/websocket?_csrf_token=OCkCHW4bDwhQMw0QHz9-FkVSBBc4KSwjBoxG4pfj7blCImMfwgWQZMKo&_track_static%5B0%5D=https%3A%2F%2Faccounts.ecitizen.go.ke%2Fen%2Fimages%2Ffavicon.ico&_track_static%5B1%5D=https%3A%2F%2Faccounts.ecitizen.go.ke%2Fen%2Fassets%2Fapp.css&_track_static%5B2%5D=https%3A%2F%2Faccounts.ecitizen.go.ke%2Fen%2Fassets%2Fapp.js&_mounts=0&_live_referer=undefined&vsn=2.0.0"

  WEBSOCKET_URL+="?_csrf_token="+crf_token
    +"&_track_static[0]=https://accounts.ecitizen.go.ke/en/images/favicon.ico"
    +"&_track_static[1]=https://accounts.ecitizen.go.ke/en/assets/app.css"
    +"&_track_static[2]=https://accounts.ecitizen.go.ke/en/assets/app.js"
    +"&_mounts=0"
    +"&_live_referer=undefined"
    +"&vsn=2.0.0"
  return WEBSOCKET_URL
}


//["15","43","lv:phx-F-TaLZjGUK72YiiG","event",{"type":"form","event":"validate_id","value":"validate_id%5Bid_number%5D=32141485&validate_id%5Bfirst_name%5D=Briazo"}]	

type Data = {
  id_number: number,
  first_name: string,
  year: string
}

function phxHeartbeat(){
  //[null,"26","phoenix","heartbeat",{}]		
  return [null,"5","phoenix","heartbeat",{}]	
}

function phxJoinArray(id: string, crf_token: string,
  data_phx_session: string, data_phx_static: string){
//["4","4","lv:phx-F-Tnx6t421AToCxE","phx_join",{"url":"https://accounts.ecitizen.go.ke/en/register/citizen/validate-id","params":{"_csrf_token":"CCxNPW89BBI-FTQYOAV1IlhnIzQTVSUgrj7g5VmpYDUKnWFRjRprq1Bl","_track_static":["https://accounts.ecitizen.go.ke/en/images/favicon.ico","https://accounts.ecitizen.go.ke/en/assets/app.css","https://accounts.ecitizen.go.ke/en/assets/app.js"],"_mounts":0},"session":"SFMyNTY.g2gDaAJhBXQAAAAIZAACaWRtAAAAFHBoeC1GLVRueDZ0NDIxQVRvQ3hFZAAMbGl2ZV9zZXNzaW9uaAJkAAx1bmF1dGhvcml6ZWRuCAC2TXXLy9PkF2QACnBhcmVudF9waWRkAANuaWxkAAhyb290X3BpZGQAA25pbGQACXJvb3Rfdmlld2QAL0VsaXhpci5TaW5nbGVTaWdub25XZWIuUmVnaXN0cmF0aW9uTGl2ZS5DaXRpemVuZAAGcm91dGVyZAAdRWxpeGlyLlNpbmdsZVNpZ25vbldlYi5Sb3V0ZXJkAAdzZXNzaW9udAAAAABkAAR2aWV3ZAAvRWxpeGlyLlNpbmdsZVNpZ25vbldlYi5SZWdpc3RyYXRpb25MaXZlLkNpdGl6ZW5uBgDTmqTgkAFiAAFRgA.DNzHYKSHPXsFst3XfBEKrC3k0IZ6qvrUvYFj7CHw1Vs","static":"SFMyNTY.g2gDaAJhBXQAAAADZAAKYXNzaWduX25ld2pkAAVmbGFzaHQAAAAAZAACaWRtAAAAFHBoeC1GLVRueDZ0NDIxQVRvQ3hFbgYA05qk4JABYgABUYA.zixhryc-OP5pcMEs2r2vm0IA7P3I6ezlrLydW1aglKs"}]	

  return ["4","7",`lv:${id}`,"phx_join",
    {"url":"https://accounts.ecitizen.go.ke/en/register/citizen/validate-id",
      "params":{
        "_csrf_token":crf_token,
        "_track_static":["https://accounts.ecitizen.go.ke/en/images/favicon.ico",
          "https://accounts.ecitizen.go.ke/en/assets/app.css",
          "https://accounts.ecitizen.go.ke/en/assets/app.js"],
        "_mounts":0},
      "session":data_phx_session,
      "static":data_phx_static}]
}

function generateData(){}

async function main(){
  const agent = new https.Agent({ keepAlive: true})
  const {default: fetch} = await import('node-fetch');
  const response = await fetch(URL_ID_VALIDATION, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
    },
    agent: agent
  })

  const cookies = response.headers.get("Set-Cookie")!
  const static_files = ["https://accounts.ecitizen.go.ke/en/images/favicon.ico",
    "https://accounts.ecitizen.go.ke/en/assets/app.css",
    "https://accounts.ecitizen.go.ke/en/assets/app.js"]
  static_files.forEach(async f=> await fetch(f,{agent: agent}))

  const html = await response.text()
  const html_elements = HTMLParser.parse(html)

  const crf_token_meta = html_elements.querySelector("meta[name='csrf-token']")
  if(crf_token_meta== null){
    console.error("crfg_token_meta not found")
    process.exit(1)
  }
  const crf_token = crf_token_meta.getAttribute("content")
  if(crf_token === undefined){
    console.error("crf_token not found")
  }

  let lv_connection_id: string | undefined  
  let phx_session: string | undefined 
  let phx_static: string | undefined 
  for( const a of html_elements.querySelectorAll(SELECT)){
    lv_connection_id = a.id
    phx_session = a.getAttribute("data-phx-session")
    phx_static = a.getAttribute("data-phx-static")
  }
  const websocketURL = generateWebSocketURL(crf_token!)
  const ws = new WebSocket(websocketURL, {
    headers: {
      cookie: cookies
    },
    agent: agent
  })
  ws.on("open", ()=>{
    const data = JSON.stringify(phxJoinArray(lv_connection_id!, crf_token!, phx_session!, phx_static!))
    ws.send(data)
  })
  ws.on("message",(data)=>{
    console.log("Recieved Data:", data.toString())
  })

  console.log(crf_token)
}

main()
