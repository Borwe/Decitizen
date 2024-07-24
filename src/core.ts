import HTMLParser from "node-html-parser"
import { WebSocket, RawData } from "ws"
import https from "https"

type HTMLElement = ReturnType<typeof HTMLParser.parse>

const SELECT = "[data-phx-session]:not([data-phx-parent-id])"

const URL_ID_VALIDATION = "https://accounts.ecitizen.go.ke/en/register/citizen/validate-id"

type Stages = "Start" | "TextFields" | "YearDropDown" | "Result"

export class Validator {
  agent = new https.Agent({ keepAlive: true})
  start = 4
  crf_token: string | undefined
  lv_connection_id: string | undefined  
  phx_session: string | undefined 
  phx_static: string | undefined 
  ws: WebSocket | undefined
  stage: Stages = "Start"
  responseposts: Array<Array<any>> = []

  constructor(public name: string, public id: string, public year: string){}

  private phxFillTexfields(): any[]{
    return ["4",""+this.start,`lv:${this.lv_connection_id}`,"event",
      {"type":"form","event":"validate",
        "value":`validate_id%5Bid_number%5D=${this.id}&validate_id%5Bfirst_name%5D=${this.name}&_target=validate_id%5Bfirst_name%5D`,"uploads":{}}]	
  }

  private phxDropDownHook(): any[]{
    return ["4",""+this.start,`lv:${this.lv_connection_id}`,"event",
      {"type":"hook","event":"combo_value","value":{"source":"year_of_birth","selected":this.year}}]	
  }

  private phxSubmit(): any[]{
    return ["4",""+this.start,`lv:${this.lv_connection_id}`,"event",
      {"type":"form","event":"validate_id","value":`validate_id%5Bid_number%5D=${this.id}&validate_id%5Bfirst_name%5D=${this.name}`}]	
  }

  private stepingWork(rawData: RawData, resolve: (value: boolean)=>void){
    const data: any[] = JSON.parse(rawData.toString())
    const current_start_in_message: string|null = data[1]
    //console.log("Recieved Data:", data[0], current_start_in_message)
    if(this.stage === "Start" && current_start_in_message === "4"){
      //means we just opened the socket and did a phx_join
      this.start+=1;
      const to_send = this.phxFillTexfields()
      this.stage = "TextFields"
      this.ws!.send(JSON.stringify(to_send))
      return
    }else if(this.stage === "TextFields" && current_start_in_message === "5"){
      this.start+=1
      const to_send = this.phxDropDownHook()
      this.stage = "YearDropDown"
      this.ws!.send(JSON.stringify(to_send))
      return
    }else if(this.stage === "YearDropDown" && current_start_in_message === "6"){
      this.start+=1
      const to_send = this.phxSubmit()
      this.stage = "Result"
      this.ws!.send(JSON.stringify(to_send))
      return
    }else if(this.stage === "Result" && current_start_in_message === "7"){
      const diff = data[4].response.diff
      const e = diff.e
      if(e){
        //if `e` exists, then we have an error message inside the current data
        //message
        const focus_array = e[0]
        if(focus_array[0] === "focus_error"){
          const tag = focus_array[1]
          if(tag.tag && tag.tag === "existing_acc_error"){
            //means this is an existing account, so success
            resolve(true)
            return
          }
        }
        resolve(false)
        return
      }
      this.responseposts.push(diff)
      return
    }else if(this.stage === "Result" && data[0]=== "4"){
      this.responseposts.push(data)
    }

    if(this.stage === "Result" && this.responseposts.length == 2){
      const second = this.responseposts[1]
      if(second[3] === "diff"){
        const diffForSecond = second[4]
        const tag = diffForSecond.e[0][1]
        if(tag && tag.tag === "error_message_0"){
          //meaning ID, Name, or Year of birth didn't match
          resolve(false)
        }
      }

      //clear
      this.responseposts = []
      return;
    }
    //console.log("Recieved Data:", JSON.stringify(data), "\n")
  }

  async begin(): Promise<boolean>{
    const {default: fetch} = await import('node-fetch');
    const response = await fetch(URL_ID_VALIDATION, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
      },
      agent: this.agent
    })

    const cookies = response.headers.get("Set-Cookie")!
    //const static_files = ["https://accounts.ecitizen.go.ke/en/images/favicon.ico",
     // "https://accounts.ecitizen.go.ke/en/assets/app.css",
     // "https://accounts.ecitizen.go.ke/en/assets/app.js"]
    //static_files.forEach(async f=> await fetch(f,{agent: this.agent}))

    const html = await response.text()
    const html_elements = HTMLParser.parse(html)
    this.getAndSetCrfToken(html_elements)
    this.getAndSetIdStaticSession(html_elements)
    this.setupWebSocket(cookies)

    return new Promise((resolve, reject)=>{
      this.openWebSocketStream(resolve,reject)
    })
  }

  /**
  * Only call after begin()
  */
  end(){
    this.ws!.close()
    this.ws = undefined
  }

  private setupWebSocket(cookies: string){
    const websocketURL = this.generateWebSocketURL(this.crf_token!)

    this.ws = new WebSocket(websocketURL, {
      headers: {
        cookie: cookies
      },
      agent: this.agent
    })
  }

  private openWebSocketStream(resolve: (value: boolean)=>void,
    reject: (value: string)=>void){

    this.ws!.on("open", ()=>{
      const data = JSON.stringify(this.phxJoinArray())
      this.ws!.send(data)
    })

    this.ws!.on("message",(data)=>{
      this.stepingWork(data, resolve)
    })

    this.ws!.on("close",()=>{
      if(this.stage !== "Result"){
        reject("Closed before completion")
      }
    })
  }

  private getAndSetCrfToken(html_elements: HTMLElement){
    const crf_token_meta = html_elements.querySelector("meta[name='csrf-token']")
    if(crf_token_meta== null){
      console.error("crfg_token_meta not found")
      throw new Error("crfg_token_meta not found")
    }

    const crf_token = crf_token_meta.getAttribute("content")
    if(crf_token === undefined){
      console.error("crf_token not found")
      throw new Error("crf_token not found")
    }
    this.crf_token = crf_token!
  }

  private getAndSetIdStaticSession(html_elements: HTMLElement){
    for( const a of html_elements.querySelectorAll(SELECT)){
      this.lv_connection_id = a.id
      this.phx_session = a.getAttribute("data-phx-session")
      this.phx_static = a.getAttribute("data-phx-static")
    }
  }

  private generateWebSocketURL(crf_token: string): string {
    let WEBSOCKET_URL = "wss://accounts.ecitizen.go.ke/live/websocket"

    WEBSOCKET_URL+="?_csrf_token="+crf_token
      +"&_track_static[0]=https://accounts.ecitizen.go.ke/en/images/favicon.ico"
      +"&_track_static[1]=https://accounts.ecitizen.go.ke/en/assets/app.css"
      +"&_track_static[2]=https://accounts.ecitizen.go.ke/en/assets/app.js"
      +"&_mounts=0"
      +"&_live_referer=undefined"
      +"&vsn=2.0.0"
    return WEBSOCKET_URL
  }

  private phxHeartbeat(){
    return [null,"5","phoenix","heartbeat",{}]	
  }

  private phxJoinArray(){
    return ["4",""+this.start,`lv:${this.lv_connection_id}`,"phx_join",
      {"url":"https://accounts.ecitizen.go.ke/en/register/citizen/validate-id",
        "params":{
          "_csrf_token":this.crf_token,
          "_track_static":["https://accounts.ecitizen.go.ke/en/images/favicon.ico",
            "https://accounts.ecitizen.go.ke/en/assets/app.css",
            "https://accounts.ecitizen.go.ke/en/assets/app.js"],
          "_mounts":0},
        "session":this.phx_session,
        "static":this.phx_static}]
  }
}
