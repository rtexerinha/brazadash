import { db } from "./db";
import { restaurants, menuItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingRestaurants = await db.select().from(restaurants);
    if (existingRestaurants.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database with Brazilian restaurants...");

    // Seed restaurants
    const [restaurant1] = await db.insert(restaurants).values({
      ownerId: "system",
      name: "Sabor do Brasil",
      description: "Authentic Brazilian cuisine featuring traditional recipes passed down through generations. Experience the true taste of Brazil.",
      cuisine: "Brazilian Traditional",
      address: "1234 Brazilian Way",
      city: "Los Angeles, CA",
      phone: "(310) 555-0123",
      imageUrl: "/images/restaurant-1.png",
      rating: "4.8",
      reviewCount: 127,
      deliveryFee: "3.99",
      deliveryTime: "30-45 min",
      isOpen: true,
    }).returning();

    const [restaurant2] = await db.insert(restaurants).values({
      ownerId: "system",
      name: "Acai Paradise",
      description: "The freshest acai bowls in California! We source our acai directly from the Amazon for authentic flavor.",
      cuisine: "Acai & Healthy",
      address: "5678 Beach Blvd",
      city: "San Diego, CA",
      phone: "(619) 555-0456",
      imageUrl: "/images/food-acai.png",
      rating: "4.9",
      reviewCount: 89,
      deliveryFee: "2.99",
      deliveryTime: "20-30 min",
      isOpen: true,
    }).returning();

    const [restaurant3] = await db.insert(restaurants).values({
      ownerId: "system",
      name: "Churrascaria Gaucha",
      description: "Premium Brazilian steakhouse experience. All-you-can-eat rodizio style with 15 cuts of meat.",
      cuisine: "Churrasco",
      address: "9012 Meat Ave",
      city: "San Francisco, CA",
      phone: "(415) 555-0789",
      imageUrl: "/images/food-picanha.png",
      rating: "4.7",
      reviewCount: 203,
      deliveryFee: "5.99",
      deliveryTime: "40-55 min",
      isOpen: true,
    }).returning();

    const [restaurant4] = await db.insert(restaurants).values({
      ownerId: "system",
      name: "Padaria Mineira",
      description: "Traditional Brazilian bakery specializing in pao de queijo, coxinhas, and freshly baked goods.",
      cuisine: "Bakery & Salgados",
      address: "3456 Bakery Lane",
      city: "Oakland, CA",
      phone: "(510) 555-0321",
      imageUrl: "/images/food-paodequeijo.png",
      rating: "4.6",
      reviewCount: 156,
      deliveryFee: "2.49",
      deliveryTime: "25-35 min",
      isOpen: true,
    }).returning();

    // Seed menu items for Restaurant 1 (Sabor do Brasil)
    await db.insert(menuItems).values([
      {
        restaurantId: restaurant1.id,
        name: "Feijoada Completa",
        description: "Traditional black bean stew with pork, served with rice, farofa, collard greens, and orange slices",
        price: "24.99",
        category: "Main Dishes",
        imageUrl: "/images/hero-food.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: "Moqueca de Peixe",
        description: "Bahian fish stew with coconut milk, palm oil, peppers, and tomatoes",
        price: "26.99",
        category: "Main Dishes",
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: "Coxinha (6 pcs)",
        description: "Crispy fried chicken croquettes with creamy filling",
        price: "12.99",
        category: "Appetizers",
        imageUrl: "/images/food-coxinha.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: "Pao de Queijo (8 pcs)",
        description: "Traditional cheese bread made with tapioca flour",
        price: "8.99",
        category: "Appetizers",
        imageUrl: "/images/food-paodequeijo.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: "Brigadeiro (4 pcs)",
        description: "Classic Brazilian chocolate truffles rolled in sprinkles",
        price: "6.99",
        category: "Desserts",
        isAvailable: true,
      },
    ]);

    // Seed menu items for Restaurant 2 (Acai Paradise)
    await db.insert(menuItems).values([
      {
        restaurantId: restaurant2.id,
        name: "Classic Acai Bowl",
        description: "Organic acai blend topped with granola, banana, strawberries, and honey",
        price: "14.99",
        category: "Acai Bowls",
        imageUrl: "/images/food-acai.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant2.id,
        name: "Tropical Paradise Bowl",
        description: "Acai topped with mango, coconut, passion fruit, and chia seeds",
        price: "16.99",
        category: "Acai Bowls",
        isAvailable: true,
      },
      {
        restaurantId: restaurant2.id,
        name: "Protein Power Bowl",
        description: "Acai with peanut butter, banana, protein granola, and cacao nibs",
        price: "17.99",
        category: "Acai Bowls",
        isAvailable: true,
      },
      {
        restaurantId: restaurant2.id,
        name: "Fresh Coconut Water",
        description: "Straight from the coconut",
        price: "5.99",
        category: "Drinks",
        isAvailable: true,
      },
    ]);

    // Seed menu items for Restaurant 3 (Churrascaria Gaucha)
    await db.insert(menuItems).values([
      {
        restaurantId: restaurant3.id,
        name: "Picanha",
        description: "Premium top sirloin cap, the most prized cut in Brazilian barbecue",
        price: "32.99",
        category: "Steaks",
        imageUrl: "/images/food-picanha.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: "Fraldinha",
        description: "Tender flank steak seasoned with rock salt",
        price: "28.99",
        category: "Steaks",
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: "Costela",
        description: "Slow-roasted beef ribs, fall-off-the-bone tender",
        price: "29.99",
        category: "Steaks",
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: "Vinagrete",
        description: "Fresh tomato and onion salsa",
        price: "4.99",
        category: "Sides",
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: "Farofa",
        description: "Toasted cassava flour with butter",
        price: "3.99",
        category: "Sides",
        isAvailable: true,
      },
    ]);

    // Seed menu items for Restaurant 4 (Padaria Mineira)
    await db.insert(menuItems).values([
      {
        restaurantId: restaurant4.id,
        name: "Pao de Queijo (12 pcs)",
        description: "Fresh-baked cheese bread, crispy outside, chewy inside",
        price: "12.99",
        category: "Bakery",
        imageUrl: "/images/food-paodequeijo.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: "Coxinha (6 pcs)",
        description: "Golden fried chicken croquettes",
        price: "11.99",
        category: "Salgados",
        imageUrl: "/images/food-coxinha.png",
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: "Pastel de Carne (4 pcs)",
        description: "Crispy pastries filled with seasoned ground beef",
        price: "10.99",
        category: "Salgados",
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: "Bolo de Cenoura",
        description: "Brazilian carrot cake with chocolate ganache",
        price: "8.99",
        category: "Desserts",
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: "Cafe Brasileiro",
        description: "Strong Brazilian coffee",
        price: "3.99",
        category: "Drinks",
        isAvailable: true,
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
