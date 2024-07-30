import express from "express"
import dotenv from "dotenv"
import { Input, URL_ID_VALIDATION, Validator } from "./core"

dotenv.config()
const PORT = process.env.PORT ? +process.env.PORT : 3000
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

type Reply = {
  success: boolean,
  message?: string
}

app.post("/", async (req, res)=>{
  let reply: Reply = {
    success: false
  }
  const body: Input = req.body
  if(body.id === undefined || body.name === undefined || body.year === undefined){
    reply.message = "Wrongly formated JSON request must contain JSON fields id, name, year"
    res.status(400).send(JSON.stringify(reply))
    return
  }
  const validator = new Validator(body.name, body.id, body.year)
  const result = await validator.begin()
  reply.success = result
  if(result === false){
    reply.message = "User not verified, possibly not registered on ecitizen"
  }
  res.status(200).send(JSON.stringify(reply))
  validator.end()
})

app.get("/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1", async (req,res)=>{
  const param = req.param("ray")
  const url = "https://accounts.ecitizen.go.ke/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1?ray="+param
  console.log("CDN-URL:",url)
  let out = await fetch(url ,{
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
      },
    })

  res.send(await out.text())
})

app.get("/debug", async(_, res)=>{

  let out = await fetch(URL_ID_VALIDATION ,{
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
      },
    })
  res.setHeader("Access-Control-Allow-Origin","*")
  let text = await out.text()
  const regex = new RegExp('__cf_chl_rt_tk[^"]*', 'g')
  const matches = text.match(regex)
  const url_extention = matches![0]

  const url = URL_ID_VALIDATION+"?"+url_extention
  console.log("URL:",url)

  out = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
      },
    })
  text = await out.text()

  res.send(text)
})

app.listen(PORT, ()=>{
  console.log("Started Server")
})

