import "dotenv/config"
import {ChatOpenAI} from "@langchain/openai";
import {FileSystemChatMessageHistory} from "@langchain/community/stores/message/file_system";
import {SystemMessage,HumanMessage,AIMessage} from "@langchain/core/messages";
import path from "node:path"

const model = new ChatOpenAI({
    modelName: process.env.QIANWEN_MODEL_NAME,
    apiKey: process.env.QIANWEN_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.QIANWEN_BASE_URL,
    },
})

async function fileHistoryDemo(){
    // 指定存储文件的路径
    const filePath = path.join(
        process.cwd(),
        "src",
        "test",
        "history",
        "chat_history.json"
    );
    const sessionId = 'user_session_001'
    const userId = 'user_id_001'

    // 系统提示词
    const systemMessage = new SystemMessage(
        '你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。'
    )
    // 创建消息历史记录器
    const history = new FileSystemChatMessageHistory({
        filePath: filePath,
        sessionId: sessionId,
        userId: userId,
    });

    console.log("[第一轮对话]：")

    const userMessage1 = new HumanMessage(
        "红烧肉怎么做？"
    )
    // 添加用户消息到历史记录
    await history.addMessage(userMessage1)
    // 获取模型的输出
    const message1 = [systemMessage, ...(await history.getMessages())]
    const response1 = await model.invoke(message1)
    // 添加助手消息到历史记录
    await history.addMessage(response1)

    // 打印对话内容
    console.log(`用户：${userMessage1.content}`)
    console.log(`助手：${response1.content}\n`)
    console.log(`✓ 对话已保存到文件: ${filePath}\n`);

    console.log("[第二轮对话]：")
    const userMessage2 = new HumanMessage(
        "好吃吗？"
    )
    await history.addMessage(userMessage2)

    const message2 = [systemMessage,...(await history.getMessages())]
    const response2 = await model.invoke(message2)
    await history.addMessage(response2)

    console.log(`用户：${userMessage2.content}`)
    console.log(`助手：${response2.content}\n`)
    console.log(`✓ 对话已保存到文件: ${filePath}\n`);
}

fileHistoryDemo();