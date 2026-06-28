import 'dotenv/config';
import {ChatOpenAI} from '@langchain/openai';
import {InMemoryChatMessageHistory} from "@langchain/core/chat_history";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";

const model = new ChatOpenAI({
    modelName: process.env.QIANWEN_MODEL_NAME,
    apiKey: process.env.QIANWEN_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.QIANWEN_BASE_URL,
    },
});

async function inMemoryDemo() {
    const history = new InMemoryChatMessageHistory()

    const systemMessage = new SystemMessage(
        "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
    )
    // 第一轮对话
    console.log("[第一轮对话]：")
    const userMessage1 = new HumanMessage(
        "你今天吃了什么好吃的呢？"
    )

    await history.addMessage(userMessage1)

    const message1 = [systemMessage, ...(await history.getMessages())];
    const response1 = await model.invoke(message1);
    await history.addMessage(response1);

    console.log(`用户：${userMessage1.text}`)
    console.log(`助手：${response1.text}\n`)

    console.log("[第二轮对话]：")
    const userMessage2 = new HumanMessage(
        "那你能教我如何做吗？"
    )
    await history.addMessage(userMessage2)

    const message2 = [systemMessage, ...(await history.getMessages())];
    const response2 = await model.invoke(message2);
    await history.addMessage(response2);

    console.log(`用户：${userMessage2.text}`)
    console.log(`助手：${response2.text}\n`)

    console.log("[历史对话记录]：")
    const allMessages = await history.getMessages();
    console.log(`共保存了${allMessages.length}条消息:`)

    allMessages.forEach((message, index) => {
        // console.log(JSON.stringify(message, null, 2))
        const prefix = message.type === "human" ? "用户" : "助手";
        console.log(`${prefix}:${message.content.substring(0, 50)}...`)
    });
}

inMemoryDemo();