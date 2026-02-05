import { db } from "./db";
import { restaurants, menuItems, serviceProviders, services } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if restaurant data already exists
    const existingRestaurants = await db.select().from(restaurants);
    const needsRestaurantSeeding = existingRestaurants.length === 0;
    
    // Check if service provider data already exists
    const existingProviders = await db.select().from(serviceProviders);
    const needsProviderSeeding = existingProviders.length === 0;
    
    if (!needsRestaurantSeeding && !needsProviderSeeding) {
      console.log("Database already seeded");
      return;
    }

    if (needsRestaurantSeeding) {
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
    } // End of restaurant seeding block

    // Seed service providers
    if (needsProviderSeeding) {
      console.log("Seeding service providers...");

      const [cleaning1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Limpeza Brasileira",
        description: "Professional house cleaning services by experienced Brazilian cleaners. We treat your home like our own with attention to detail and care.",
        category: "cleaning",
        address: "2345 Clean St",
        city: "Los Angeles, CA",
        phone: "(310) 555-1234",
        email: "contato@limpezabrasileira.com",
        languages: "Portuguese, English, Spanish",
        yearsExperience: 8,
        rating: "4.9",
        reviewCount: 156,
        priceRange: "$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: cleaning1.id, name: "Deep House Cleaning", description: "Complete deep cleaning of your entire home", price: "180.00", priceType: "fixed", duration: 240 },
        { providerId: cleaning1.id, name: "Regular Cleaning", description: "Weekly or bi-weekly maintenance cleaning", price: "45.00", priceType: "hourly", duration: 120 },
        { providerId: cleaning1.id, name: "Move-in/Move-out Cleaning", description: "Thorough cleaning for moving", price: "250.00", priceType: "fixed", duration: 300 },
      ]);

      const [beauty1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Beleza Brasil Salon",
        description: "Full-service Brazilian beauty salon specializing in keratin treatments, Brazilian blowouts, and authentic styling techniques.",
        category: "beauty",
        address: "789 Beauty Blvd",
        city: "San Diego, CA",
        phone: "(619) 555-5678",
        email: "belezabrasil@email.com",
        languages: "Portuguese, English",
        yearsExperience: 12,
        rating: "4.8",
        reviewCount: 234,
        priceRange: "$$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: beauty1.id, name: "Brazilian Blowout", description: "Smoothing treatment for frizz-free hair", price: "250.00", priceType: "fixed", duration: 180 },
        { providerId: beauty1.id, name: "Keratin Treatment", description: "Professional keratin hair treatment", price: "300.00", priceType: "fixed", duration: 210 },
        { providerId: beauty1.id, name: "Hair Cut & Style", description: "Precision cut with Brazilian styling", price: "65.00", priceType: "fixed", duration: 60 },
      ]);

      const [legal1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Advocacia Silva & Associados",
        description: "Brazilian-American law firm specializing in immigration, business law, and international matters. Bilingual attorneys who understand your needs.",
        category: "legal",
        address: "456 Legal Center",
        city: "San Francisco, CA",
        phone: "(415) 555-9012",
        email: "info@silvalaw.com",
        website: "www.silvalaw.com",
        languages: "Portuguese, English, Spanish",
        yearsExperience: 15,
        rating: "4.7",
        reviewCount: 89,
        priceRange: "$$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: legal1.id, name: "Immigration Consultation", description: "Initial consultation for visa and immigration matters", price: "150.00", priceType: "fixed", duration: 60 },
        { providerId: legal1.id, name: "Business Formation", description: "LLC or corporation setup and documentation", price: "1500.00", priceType: "fixed" },
        { providerId: legal1.id, name: "Legal Consultation", description: "General legal advice session", price: "200.00", priceType: "hourly", duration: 60 },
      ]);

      const [fitness1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Jiu-Jitsu Academia Brasileira",
        description: "Authentic Brazilian Jiu-Jitsu training from black belt instructors. Classes for all levels, from beginners to competitors.",
        category: "fitness",
        address: "321 Fight Way",
        city: "Oakland, CA",
        phone: "(510) 555-3456",
        email: "treino@bjjbrasil.com",
        languages: "Portuguese, English",
        yearsExperience: 20,
        rating: "5.0",
        reviewCount: 312,
        priceRange: "$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: fitness1.id, name: "Private BJJ Lesson", description: "One-on-one training with black belt instructor", price: "100.00", priceType: "fixed", duration: 60 },
        { providerId: fitness1.id, name: "Monthly Membership", description: "Unlimited group classes", price: "150.00", priceType: "fixed" },
        { providerId: fitness1.id, name: "Trial Class", description: "First class free trial", price: "0.00", priceType: "fixed", duration: 60 },
      ]);

      const [auto1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Auto Brasil Mechanics",
        description: "Honest and reliable auto repair by Brazilian mechanics. We specialize in all makes and models with fair pricing.",
        category: "auto",
        address: "654 Motor Ave",
        city: "Los Angeles, CA",
        phone: "(310) 555-7890",
        email: "autobrasil@email.com",
        languages: "Portuguese, English, Spanish",
        yearsExperience: 10,
        rating: "4.6",
        reviewCount: 178,
        priceRange: "$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: auto1.id, name: "Oil Change", description: "Full synthetic oil change with filter", price: "65.00", priceType: "fixed", duration: 30 },
        { providerId: auto1.id, name: "Brake Service", description: "Brake pad replacement and inspection", price: "200.00", priceType: "fixed", duration: 90 },
        { providerId: auto1.id, name: "Diagnostic Check", description: "Computer diagnostic and assessment", price: "50.00", priceType: "fixed", duration: 45 },
      ]);

      const [immigration1] = await db.insert(serviceProviders).values({
        userId: "system",
        businessName: "Imigra Brasil Consultoria",
        description: "Immigration consulting services for the Brazilian community. We help with visa applications, green cards, and citizenship.",
        category: "immigration",
        address: "987 Visa Plaza",
        city: "San Jose, CA",
        phone: "(408) 555-4567",
        email: "ajuda@imigrabrasil.com",
        languages: "Portuguese, English",
        yearsExperience: 12,
        rating: "4.8",
        reviewCount: 267,
        priceRange: "$$",
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(services).values([
        { providerId: immigration1.id, name: "Visa Consultation", description: "Personalized visa pathway assessment", price: "100.00", priceType: "fixed", duration: 60 },
        { providerId: immigration1.id, name: "Application Assistance", description: "Help with form preparation and documentation", price: "300.00", priceType: "fixed" },
        { providerId: immigration1.id, name: "Green Card Process", description: "Full green card application support", price: "1500.00", priceType: "fixed" },
      ]);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
