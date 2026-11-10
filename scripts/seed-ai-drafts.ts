import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const AI_DRAFTS_DIR = join("fixtures", "ai-drafts");
if (!existsSync(AI_DRAFTS_DIR)) mkdirSync(AI_DRAFTS_DIR, { recursive: true });

// ============================================================================
// FILL THIS ARRAY WITH 30 AI-GENERATED PARAGRAPHS.
//
// How to fill it:
//   1. Open ChatGPT/Claude/Gemini.
//   2. Paste this prompt:
//
//      "Write 30 short paragraphs (80-150 words each) about DIFFERENT topics
//       (cooking, travel, health, finance, history, sports, technology, music,
//       science, fashion, gardening, DIY, pets, careers, education, space,
//       psychology, food, art, literature, marketing, productivity, fitness,
//       parenting, environment, cars, photography, gaming, movies, architecture).
//       Use typical AI-generated style: clear, structured, slightly generic."
//
//   3. Copy each paragraph and replace the "" below. Keep the quotes.
//   4. Run: npx tsx scripts/seed-ai-drafts.ts
// ============================================================================

const AI_PARAGRAPHS: string[] = [
  // 01 - cooking
  "Cooking is both an art and a science. When preparing meals, it is essential to balance flavors and textures to create a memorable dining experience. Fresh ingredients are the foundation of great cooking, and proper techniques such as sautéing, braising, and roasting can elevate even the simplest dishes. Moreover, understanding the chemistry behind food preparation allows home cooks to experiment with confidence. From mastering knife skills to learning the nuances of seasoning, every step in the cooking process offers an opportunity to grow.",

  // 02 - travel
  "Traveling is a transformative experience that broadens one's perspective and fosters personal growth. Exploring new destinations allows individuals to immerse themselves in different cultures, traditions, and lifestyles. Whether it's wandering through ancient ruins, sampling local cuisine, or engaging with communities, travel offers countless opportunities for discovery. Furthermore, traveling can enhance problem-solving skills and adaptability, as navigating unfamiliar environments often requires quick thinking. The memories created during journeys often last a lifetime and inspire future adventures.",

  // 03 - health
  "Maintaining good health is a multifaceted endeavor that encompasses physical, mental, and emotional well-being. Regular exercise, a balanced diet, and adequate sleep form the foundation of a healthy lifestyle. Additionally, managing stress through mindfulness and relaxation techniques can significantly improve overall quality of life. Preventive care, including routine check-ups and vaccinations, plays a crucial role in detecting potential issues early. Ultimately, small, consistent habits often yield the greatest long-term benefits for health.",

  // 04 - finance
  "Personal finance management is a critical skill that empowers individuals to achieve their financial goals. Creating a budget helps track income and expenses, ensuring that spending aligns with priorities. Building an emergency fund provides a financial safety net for unexpected events. Furthermore, understanding investment options such as stocks, bonds, and retirement accounts can help grow wealth over time. Avoiding excessive debt and maintaining a good credit score are also essential components of a sound financial strategy.",

  // 05 - history
  "History offers invaluable lessons that help us understand the present and shape the future. Studying past civilizations, conflicts, and social movements provides insight into human behavior and societal evolution. Historical analysis encourages critical thinking and helps identify patterns that may repeat over time. Moreover, preserving historical records and artifacts ensures that future generations can learn from the past. By examining historical events from multiple perspectives, we develop a more nuanced understanding of the world.",

  // 06 - sports
  "Sports play a vital role in promoting physical fitness, teamwork, and discipline. Participating in athletic activities improves cardiovascular health, builds strength, and enhances coordination. Beyond physical benefits, sports teach valuable life skills such as perseverance, leadership, and cooperation. Spectator sports also foster community spirit and create shared experiences among fans. Whether played competitively or recreationally, sports contribute to a balanced and active lifestyle.",

  // 07 - technology
  "Technology continues to reshape the way we live, work, and communicate. Advancements in artificial intelligence, cloud computing, and mobile devices have transformed industries and daily routines. Staying informed about emerging technologies is essential for both personal and professional growth. However, it is equally important to consider the ethical implications and potential risks associated with rapid technological change. Balancing innovation with responsible use remains a key challenge for modern society.",

  // 08 - music
  "Music is a universal language that transcends cultural boundaries and evokes powerful emotions. It serves as a form of expression, communication, and entertainment across all societies. Learning to play an instrument can enhance cognitive abilities, improve memory, and foster discipline. Additionally, listening to music has been shown to reduce stress and improve mood. From classical compositions to contemporary genres, music enriches the human experience in countless ways.",

  // 09 - science
  "Science is the systematic pursuit of knowledge through observation, experimentation, and reasoning. It underpins many of the technological and medical advancements that shape modern life. The scientific method provides a structured approach to testing hypotheses and drawing conclusions. Moreover, scientific literacy is essential for making informed decisions about issues such as climate change and public health. Encouraging curiosity and critical thinking in science education is vital for future progress.",

  // 10 - fashion
  "Fashion is a dynamic form of self-expression that reflects cultural trends and individual identity. Clothing choices communicate personality, status, and creativity. The fashion industry continuously evolves, influenced by social movements, technology, and sustainability concerns. Building a versatile wardrobe with timeless pieces can help individuals express their style while making mindful purchasing decisions. Ultimately, fashion is about confidence and comfort as much as aesthetics.",

  // 11 - gardening
  "Gardening is a rewarding activity that connects individuals with nature and promotes well-being. Cultivating plants requires patience, planning, and an understanding of soil, water, and light requirements. Gardening can also improve mental health by reducing stress and providing a sense of accomplishment. Moreover, growing one's own vegetables and herbs offers fresh, nutritious produce. Whether on a small balcony or a large backyard, gardening offers benefits for people of all ages.",

  // 12 - DIY
  "Do-it-yourself projects empower individuals to learn new skills and save money. From home repairs to crafting and upcycling, DIY activities encourage creativity and problem-solving. Proper planning, the right tools, and safety precautions are essential for successful projects. Additionally, completing a DIY task can boost confidence and provide a sense of fulfillment. In an era of mass production, DIY projects also promote sustainability by reusing materials.",

  // 13 - pets
  "Pets bring joy, companionship, and structure to the lives of their owners. Caring for an animal requires commitment, patience, and responsibility. Regular veterinary care, proper nutrition, and adequate exercise are essential for keeping pets healthy and happy. Moreover, interacting with pets has been shown to reduce stress and improve mental well-being. Building a strong bond with a pet can be one of the most rewarding experiences in life.",

  // 14 - careers
  "Building a successful career requires continuous learning, adaptability, and strategic planning. Identifying one's strengths and interests helps guide professional choices and development. Networking and mentorship can open doors to new opportunities and provide valuable guidance. Furthermore, developing soft skills such as communication and teamwork is often as important as technical expertise. Navigating career changes with resilience and a growth mindset is key to long-term success.",

  // 15 - education
  "Education is a cornerstone of personal and societal development. Access to quality education equips individuals with knowledge, skills, and critical thinking abilities. Modern education increasingly incorporates technology and personalized learning approaches to meet diverse needs. Moreover, lifelong learning is essential in a rapidly changing world, where new skills are constantly in demand. Investing in education benefits individuals, communities, and economies alike.",

  // 16 - space
  "Space exploration has expanded our understanding of the universe and inspired generations. Missions to the Moon, Mars, and beyond have yielded valuable scientific data and technological innovations. Satellites play a crucial role in communication, navigation, and weather monitoring. Furthermore, the study of space helps address fundamental questions about the origins of life and the cosmos. International collaboration in space exploration continues to push the boundaries of human achievement.",

  // 17 - psychology
  "Psychology offers valuable insights into human behavior, emotions, and cognition. Understanding psychological principles can improve relationships, decision-making, and mental health. Research in areas such as motivation, memory, and personality continues to inform practices in education, work, and therapy. Moreover, recognizing the importance of mental well-being has become increasingly central to public health discussions. Applying psychological knowledge can enhance personal growth and empathy.",

  // 18 - food
  "Food is more than mere sustenance; it is a cultural, social, and sensory experience. Different cuisines reflect the history, geography, and values of communities around the world. Understanding nutrition helps individuals make healthier food choices and maintain energy levels. Moreover, sharing meals fosters connection and strengthens relationships. From farm to table, the journey of food involves complex systems that impact health, economies, and the environment.",

  // 19 - art
  "Art is a powerful means of expression that captures emotions, ideas, and cultural values. From painting and sculpture to digital media, artistic practices continue to evolve with technology and society. Engaging with art can enhance creativity, empathy, and critical thinking. Moreover, art serves as a record of human history and a catalyst for social change. Supporting artists and cultural institutions enriches communities and preserves diverse perspectives.",

  // 20 - literature
  "Literature offers a window into the human experience, exploring themes of love, loss, identity, and society. Reading fiction and poetry enhances empathy, vocabulary, and critical thinking skills. Classic works provide historical and cultural context, while contemporary literature reflects modern concerns and voices. Moreover, writing and sharing stories fosters connection and preserves collective memory. Literature remains an enduring source of inspiration and reflection.",

  // 21 - marketing
  "Marketing is the art and science of connecting products and services with the right audiences. Effective marketing strategies combine research, creativity, and data analysis to understand consumer needs. Digital platforms have transformed how brands engage with customers, enabling personalized and interactive campaigns. Moreover, ethical marketing builds trust and long-term loyalty. Staying adaptable to changing trends and technologies is essential for success in the modern marketplace.",

  // 22 - productivity
  "Productivity is about achieving meaningful results efficiently and sustainably. Setting clear goals and prioritizing tasks help individuals focus their time and energy. Techniques such as time blocking, the Pomodoro method, and task batching can improve workflow. Moreover, regular breaks and adequate rest are essential for maintaining focus and avoiding burnout. Ultimately, productivity is most effective when aligned with personal values and long-term objectives.",

  // 23 - fitness
  "Fitness encompasses physical activity, nutrition, and recovery, all of which contribute to overall well-being. Regular exercise strengthens the heart, builds muscle, and improves mental health. A balanced routine should include cardiovascular activity, strength training, and flexibility work. Moreover, setting realistic goals and tracking progress help maintain motivation. Consistency and proper form are often more important than intensity when building a sustainable fitness routine.",

  // 24 - parenting
  "Parenting is a rewarding yet challenging journey that shapes a child's development and well-being. Providing a safe, nurturing environment fosters emotional security and confidence. Clear communication, consistent boundaries, and positive reinforcement support healthy behavior. Moreover, parents benefit from building support networks and seeking reliable information on child development. Every child is unique, and adapting parenting approaches to individual needs is essential for healthy growth.",

  // 25 - environment
  "Protecting the environment is essential for sustaining life on Earth. Climate change, pollution, and habitat loss pose significant challenges that require collective action. Individuals can contribute by reducing waste, conserving energy, and supporting sustainable practices. Moreover, governments and businesses play a crucial role in developing policies and technologies that minimize environmental impact. Raising awareness and fostering environmental stewardship are vital for a sustainable future.",

  // 26 - cars
  "Automobiles have transformed transportation, mobility, and modern life. Advances in engineering have improved safety, efficiency, and performance over time. Electric vehicles and autonomous driving technologies represent the next frontier of automotive innovation. Moreover, regular maintenance and responsible driving habits extend a vehicle's lifespan and reduce environmental impact. Understanding how cars work helps owners make informed decisions about purchasing, maintenance, and sustainability.",

  // 27 - photography
  "Photography is a powerful medium for capturing moments, telling stories, and expressing creativity. Understanding composition, lighting, and camera settings enables photographers to produce compelling images. Modern smartphones and digital cameras have made photography more accessible than ever. Moreover, practicing regularly and studying the work of others helps develop a unique visual style. Photography also preserves memories and documents history for future generations.",

  // 28 - gaming
  "Video games have evolved into a major form of entertainment and cultural expression. They offer immersive experiences that challenge players' skills, creativity, and problem-solving abilities. Moreover, online gaming fosters social connection and teamwork among players worldwide. The industry continues to grow through advances in virtual reality, esports, and interactive storytelling. Responsible gaming habits, including managing screen time, are important for a balanced lifestyle.",

  // 29 - movies
  "Movies are a powerful form of storytelling that entertain, inform, and inspire audiences. They combine visual art, sound, writing, and performance to create immersive experiences. Cinema reflects and shapes cultural values, addressing social issues and exploring human emotions. Moreover, technological advances in visual effects and streaming have transformed how films are produced and consumed. Great movies endure because they connect with universal themes and experiences.",

  // 30 - architecture
  "Architecture blends art, engineering, and functionality to create spaces where people live, work, and gather. Thoughtful design considers aesthetics, safety, sustainability, and the needs of users. Iconic buildings often reflect cultural values and historical contexts. Moreover, sustainable architecture increasingly focuses on energy efficiency and environmentally friendly materials. Good architecture enhances quality of life and shapes the character of communities and cities.",
];

// ============================================================================
// Do not edit below this line
// ============================================================================

let written = 0;
let skipped = 0;

for (let i = 0; i < AI_PARAGRAPHS.length; i++) {
  const text = (AI_PARAGRAPHS[i] || "").trim();
  const filename = join(AI_DRAFTS_DIR, `${String(i + 1).padStart(2, "0")}.txt`);

  if (text.length === 0) {
    console.log(`  - Skipping ${filename} (empty)`);
    skipped++;
    continue;
  }

  writeFileSync(filename, text, "utf-8");
  console.log(`  ✓ ${filename} (${text.split(/\s+/).length} words)`);
  written++;
}

console.log(`\nWrote ${written} files, skipped ${skipped} empty slots.`);
if (written < 30) {
  console.log(`\nFill in the remaining ${30 - written} empty slots in scripts/seed-ai-drafts.ts and re-run.`);
} else {
  console.log("\nAll 30 AI-draft fixtures are populated.");
}