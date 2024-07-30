import HTMLParser from "node-html-parser"
import { WebSocket, RawData } from "ws"

type HTMLElement = ReturnType<typeof HTMLParser.parse>

const SELECT = "[data-phx-session]:not([data-phx-parent-id])"

export const URL_ID_VALIDATION = "https://accounts.ecitizen.go.ke/en/register/citizen/validate-id"

type Stages = "Start" | "TextFields" | "YearDropDown" | "Result"

export type Input = {
  id?: string,
  name?: string,
  year?: string
}

export class Validator {
  start = 4
  crf_token: string | undefined
  lv_connection_id: string | undefined
  phx_session: string | undefined
  phx_static: string | undefined
  ws: WebSocket | undefined
  stage: Stages = "Start"
  responseposts: Array<Array<any>> = [];
  asyncGenerator: AsyncGenerator<boolean | Input | string | undefined, void, Input | undefined> | undefined

  async validate(input: Input): Promise<boolean | string> {
    if (this.asyncGenerator === undefined) {
      this.asyncGenerator = this.generator()
    }

    await this.asyncGenerator.next()
    let result = (await this.asyncGenerator.next(input)).value
    console.log("RESULT1:", result)

    return result as boolean
  }

  async *generator() {
    let value: Input | undefined;
    while (true) {
      value = yield value
      console.log("RECIEVED:", value)
      const result = await this.begin(value!)
      console.log("RESULTD:", result)
      yield result
    }
  }

  private phxFillTexfields(id: string, name: string): any[] {
    return ["4", "" + this.start, `lv:${this.lv_connection_id}`, "event",
      {
        "type": "form", "event": "validate",
        "value": `validate_id%5Bid_number%5D=${id}&validate_id%5Bfirst_name%5D=${name}&_target=validate_id%5Bfirst_name%5D`, "uploads": {}
      }]
  }

  private phxDropDownHook(year: string): any[] {
    return ["4", "" + this.start, `lv:${this.lv_connection_id}`, "event",
      { "type": "hook", "event": "combo_value", "value": { "source": "year_of_birth", "selected": year } }]
  }

  private phxSubmit(id: string, name: string): any[] {
    return ["4", "" + this.start, `lv:${this.lv_connection_id}`, "event",
      { "type": "form", "event": "validate_id", "value": `validate_id%5Bid_number%5D=${id}&validate_id%5Bfirst_name%5D=${name}` }]
  }

  private stepingWork(rawData: RawData, resolve: (value: boolean) => void, input: Input) {
    let data = []
    try {
      data = JSON.parse(rawData.toString())
    } catch (e) { }

    if (data[2] && data[2] === "phoenix") {
      return;
    }
    if (this.stage === "Start") {
      //means we just opened the socket and did a phx_join
      console.log("STARTING")
      this.start += 1;
      const to_send = this.phxFillTexfields(input.id!, input.name!)
      this.stage = "TextFields"
      this.ws!.send(JSON.stringify(to_send))
      return
    } else if (this.stage === "TextFields") {
      this.start += 1
      const to_send = this.phxDropDownHook(input.year!)
      this.stage = "YearDropDown"
      this.ws!.send(JSON.stringify(to_send))
      return
    } else if (this.stage === "YearDropDown") {
      const to_send = this.phxSubmit(input.id!, input.name!)
      this.stage = "Result"
      this.ws!.send(JSON.stringify(to_send))
      return
    } else if (this.stage === "Result") {
      console.log("RESULT Recieved Data:", JSON.stringify(data), "\n")
      if (data[4].response) {
        const diff = data[4].response.diff || undefined
        if (diff.e) {
          const e = diff.e
          //if `e` exists, then we have an error message inside the current data
          //message
          const focus_array = e[0]
          if (focus_array[0] === "focus_error") {
            const tag = focus_array[1]
            if (tag.tag && tag.tag === "existing_acc_error") {
              //means this is an existing account, so success
              resolve(true)
              console.log("JESUS")
              return
            } else {
              resolve(false)
            }
          }
          resolve(false)
          return
        }
        this.responseposts.push(data)
        return
      }
      this.responseposts.push(data)
    }
    if (this.stage === "Result" && this.responseposts.length > 1) {
      console.log("HMMMMMMMMMMMMMMMMMMMMMMMM")
      const second = this.responseposts[1]
      if (second[3] === "diff") {
        const diffForSecond = second[4]
        const tag = diffForSecond.e[0][1]
        if (tag && tag.tag === "error_message_0") {
          //meaning ID, Name, or Year of birth didn't match
          console.log("RESOLVE FALSE")
          resolve(false)
        }
      }

      //clear
      this.responseposts = []
      return;
    }
    console.log("Recieved Data:", JSON.stringify(data), "\n")
  }

  async getCredentials() {
    const response = await fetch(URL_ID_VALIDATION, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
      },
    }).catch(_ => {
      throw new Error("Failed to fetch: " + JSON.toString())
    })

    const cookies = response.headers.get("Set-Cookie")!

    const html = await response.text()
    const html_elements = HTMLParser.parse(html)
    this.getAndSetCrfToken(html_elements)
    this.getAndSetIdStaticSession(html_elements)
    this.setupWebSocket(cookies)

  }

  async begin(input: Input): Promise<boolean> {
    this.stage = "Start"
    this.responseposts = []

    let continued = false

    if (this.ws === undefined) {
      await this.getCredentials()
    } else {
      //means socket was already open so set continued to true
      continued = true
    }

    return new Promise((resolve, reject) => {
      this.openWebSocketStream(resolve, reject, input, continued)
    })
  }

  /**
  * Only call after begin()
  */
  end() {
    this.ws!.close()
    this.ws = undefined
  }

  private setupWebSocket(cookies: string) {
    const websocketURL = this.generateWebSocketURL(this.crf_token!)

    this.ws = new WebSocket(websocketURL, {
      headers: {
        cookie: cookies
      },
    })
  }

  private async setupRefreshing() {
    while (this.ws !== undefined) {
      this.ws.send(JSON.stringify(this.phxHeartbeat()))
      await new Promise(resolve => {
        setTimeout(() => { resolve(true) }, 2000)
      })
    }
  }

  /** Handle the opening and sending in websocket
  * Also not when being called from an already open
  * socket */
  private openWebSocketStream(resolve: (value: boolean) => void,
    reject: (value: string) => void, input: Input, continued: boolean) {

    this.ws!.removeAllListeners()

    console.log("Done removing")

    if (continued) {
      this.stepingWork([], resolve, input)
    } else {
      this.ws!.on("open", () => {
        const data = JSON.stringify(this.phxJoinArray())
        this.ws!.send(data)
        this.setupRefreshing()
      })
      console.log("NEW")
    }

    this.ws!.on("message", (data) => {
      this.stepingWork(data, resolve, input)
    })

    this.ws!.on("close", () => {
      if (this.stage !== "Result") {
        this.ws = undefined
        reject("Closed before completion")
      }
    })
  }

  private getAndSetCrfToken(html_elements: HTMLElement) {
    const crf_token_meta = html_elements.querySelector("meta[name='csrf-token']")
    if (crf_token_meta == null) {
      console.error("crfg_token_meta not found")
      throw new Error("crfg_token_meta not found")
    }

    const crf_token = crf_token_meta.getAttribute("content")
    if (crf_token === undefined) {
      console.error("crf_token not found")
      throw new Error("crf_token not found")
    }
    this.crf_token = crf_token!
  }

  private getAndSetIdStaticSession(html_elements: HTMLElement) {
    for (const a of html_elements.querySelectorAll(SELECT)) {
      this.lv_connection_id = a.id
      this.phx_session = a.getAttribute("data-phx-session")
      this.phx_static = a.getAttribute("data-phx-static")
    }
  }

  private generateWebSocketURL(crf_token: string): string {
    let WEBSOCKET_URL = "wss://accounts.ecitizen.go.ke/live/websocket"

    WEBSOCKET_URL += "?_csrf_token=" + crf_token
      + "&_track_static[0]=https://accounts.ecitizen.go.ke/en/images/favicon.ico"
      + "&_track_static[1]=https://accounts.ecitizen.go.ke/en/assets/app.css"
      + "&_track_static[2]=https://accounts.ecitizen.go.ke/en/assets/app.js"
      + "&_mounts=0"
      + "&_live_referer=undefined"
      + "&vsn=2.0.0"
    return WEBSOCKET_URL
  }

  private phxHeartbeat() {
    return [null, "5", "phoenix", "heartbeat", {}]
  }

  private phxJoinArray() {
    return ["4", "" + this.start, `lv:${this.lv_connection_id}`, "phx_join",
      {
        "url": "https://accounts.ecitizen.go.ke/en/register/citizen/validate-id",
        "params": {
          "_csrf_token": this.crf_token,
          "_track_static": ["https://accounts.ecitizen.go.ke/en/images/favicon.ico",
            "https://accounts.ecitizen.go.ke/en/assets/app.css",
            "https://accounts.ecitizen.go.ke/en/assets/app.js"],
          "_mounts": 0
        },
        "session": this.phx_session,
        "static": this.phx_static
      }]
  }
}
