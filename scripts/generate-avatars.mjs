import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const names = [
  "Ananya", "Priya", "Riya", "Aarav", "Ishita",
  "Kabir", "Meera", "Arjun", "Sneha", "Aditya",
  "Tanya", "Rohan", "Simran", "Vihaan", "Kavya",
  "Dev", "Nisha", "Karan", "Aisha", "Yash",
  "Diya", "Rahul", "Pooja", "Samar", "Neha",
  "Aryan", "Sanya", "Varun", "Ira", "Aditi",
];

const output = path.join(process.cwd(), "public", "profiles");
mkdirSync(output, { recursive: true });

for (let index = 0; index < names.length; index++) {
  const avatar = createAvatar(notionists, {
    seed: `coy-${names[index]}-${index}`,
    size: 512,
    backgroundColor: [
      "fce7f3",
      "ede9fe",
      "dbeafe",
      "fef3c7",
      "dcfce7",
    ],
  });

  const filename = `profile-${index + 2}.svg`;
  writeFileSync(
    path.join(output, filename),
    avatar.toString(),
    "utf8"
  );
}

console.log(`SUCCESS: Generated ${names.length} local avatars.`);