import express from "express"
import dotenv from "dotenv"
import { Input, Validator } from "./core"

dotenv.config()
const PORT = process.env.PORT || 80
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

app.listen(PORT, ()=>{
  console.log("Started Server")
})

