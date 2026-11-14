import "dotenv/config";
import { chatWithFallback } from "./lib/ai/chat";

async function main() {
  const text = "Maintaining a consistent fitness routine is essential for long-term physical and mental well-being. It is important to note that regular exercise not only helps in managing weight but also significantly reduces the risk of chronic diseases such as heart disease and diabetes. Furthermore, engaging in physical activity triggers the release of endorphins, which are natural mood elevators. To maximize results, individuals should mix cardiovascular exercises, strength training, and flexibility work into their weekly schedule.";

  console.log("Sending to DeepSeek...");
  try {
    const result = await chatWithFallback({
      system: "You are an aggressive humanizer. Break the rules. Start sentences with And or But. Use fragments. Make sentence lengths wildly different.",
      user: `Rewrite this: ${text}`,
      maxTokens: 1000,
      temperature: 0.7,
    });
    console.log("SUCCESS:");
    console.log(result.text);
  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);
  }
}

main();