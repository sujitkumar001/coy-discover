
export type Profile = {
  id: number;
  name: string;
  age: number;
  city: string;
  college: string;
  bio: string;
  photo: string;
  interests: string[];
};

const names = [
  "Ananya", "Priya", "Riya", "Aarav", "Ishita",
  "Kabir", "Meera", "Arjun", "Sneha", "Aditya",
  "Tanya", "Rohan", "Simran", "Vihaan", "Kavya",
  "Dev", "Nisha", "Karan", "Aisha", "Yash",
  "Diya", "Rahul", "Pooja", "Samar", "Neha",
  "Aryan", "Sanya", "Varun", "Ira", "Aditi",
];

const cities = [
  "Delhi", "Gurgaon", "Noida", "Mumbai",
  "Pune", "Bangalore", "Hyderabad", "Jaipur",
];

const colleges = [
  "Delhi University",
  "Amity University",
  "IIT Delhi",
  "Manipal University",
  "VIT",
  "Christ University",
];

const bios = [
  "Coffee, conversations, and spontaneous adventures.",
  "I love traveling, music, and discovering new places.",
  "Book lover who enjoys meaningful conversations.",
  "Always ready for a road trip and good food.",
  "Photography, sunsets, and exploring new cities.",
  "Tech enthusiast with a love for music and movies.",
  "Fitness, nature walks, and weekend adventures.",
  "Looking for genuine connections and good vibes.",
];

const interests = [
  "Travel", "Music", "Photography", "Movies",
  "Coding", "Fitness", "Reading", "Cooking",
  "Cricket", "Art", "Gaming", "Hiking",
];

export const profiles: Profile[] = names.map((name, index) => ({
  id: index + 2,
  name,
  age: 21 + (index % 8),
  city: cities[index % cities.length],
  college: colleges[index % colleges.length],
  bio: bios[index % bios.length],
  photo: `/profiles/profile-${index + 2}.svg`,
  interests: [
    interests[index % interests.length],
    interests[(index + 3) % interests.length],
    interests[(index + 6) % interests.length],
  ],
}));
