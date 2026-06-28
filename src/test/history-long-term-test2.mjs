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
    const restoredHistory = new FileSystemChatMessageHistory({
        filePath: filePath,
        sessionId: sessionId,
        userId: userId,
    });
    // 获取历史消息
    const restoredMessages = await restoredHistory.getMessages()
    console.log(`从文件恢复了 ${restoredMessages.length} 条历史消息：`);
    restoredMessages.forEach((msg, index) => {
        const type = msg.type;
        const prefix = type === 'human' ? '用户' : '助手';
        console.log(`  ${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`);
    });


    console.log("[第三轮对话]：")

    const userMessage3 = new HumanMessage(
        "需要哪些食材？"
    )
    // 添加用户消息到历史记录
    await restoredHistory.addMessage(userMessage3)

    // 获取模型的输出
    const message3 = [systemMessage, ...(await restoredHistory.getMessages())]
    const response3 = await model.invoke(message3)
    // 添加助手消息到历史记录
    await restoredHistory.addMessage(response3)

    // 打印对话内容
    console.log(`用户：${userMessage3.content}`)
    console.log(`助手：${response3.content}\n`)
    console.log(`✓ 对话已保存到文件: ${filePath}\n`);


}

fileHistoryDemo();