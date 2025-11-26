
import { GoogleGenAI, Type } from "@google/genai";
import { ErgonomicAnalysis, DailyRecord, PredictionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash";

export const analyzeErgonomics = async (base64Image: string): Promise<ErgonomicAnalysis> => {
  // Clean base64 string if it includes the header
  const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: data
            }
          },
          {
            text: "分析这张网络摄像头截图的电脑人体工学情况。评估用户的坐姿、光线条件和屏幕距离。请使用中文(Simplified Chinese)返回JSON格式的分析结果。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "从1-100的人体工学评分" },
            lighting: { type: Type.STRING, description: "光线分析简述" },
            posture: { type: Type.STRING, description: "姿态分析简述" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3条简短可行的中文建议"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ErgonomicAnalysis;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      score: 0,
      lighting: "未知",
      posture: "未知",
      recommendations: ["无法分析图像，请检查网络或重试。"]
    };
  }
};

export const predictVisionHealth = async (history: DailyRecord[]): Promise<PredictionData> => {
  // Format history for the prompt
  const historySummary = history.map(h => ({
    date: h.date,
    efficiency: `${h.score}%`,
    duration: `${Math.round(h.effectiveSeconds / 60)} minutes`
  }));

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            text: `基于以下用户过去几天的屏幕使用数据，分析其视力健康风险并预测未来3天的效率趋势。
            数据: ${JSON.stringify(historySummary)}
            
            请返回JSON，包含：
            1. healthScore: 当前健康评分 (0-100)
            2. trend: "improving", "declining", 或 "stable"
            3. analysisText: 一段简短的中文分析，指出用户习惯好坏及潜在风险。
            4. futurePoints: 未来3天的预测效率值(0-100的整数)，格式为 [{date: 'YYYY-MM-DD', value: number}]。日期必须接续在历史数据之后。`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER },
            trend: { type: Type.STRING, enum: ["improving", "declining", "stable"] },
            analysisText: { type: Type.STRING },
            futurePoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text) as PredictionData;
    }
    throw new Error("No response");

  } catch (error) {
    console.error("Gemini Prediction Error:", error);
    // Fallback mock data
    const today = new Date();
    return {
        healthScore: 60,
        trend: 'stable',
        analysisText: "由于网络原因无法连接 AI 预测模型。请稍后再试。",
        futurePoints: [1,2,3].map(i => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return { date: d.toISOString().split('T')[0], value: 60 };
        })
    };
  }
};
