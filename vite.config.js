import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        services: "services.html",
        materials: "materials.html",
        howItWorks: "how-it-works.html",
        gallery: "gallery.html",
        contacts: "contacts.html",
        login: "login.html",
        register: "register.html",
        dashboard: "dashboard.html",
        upload: "upload.html",
        requests: "requests.html",
        profile: "profile.html",
        admin: "admin.html",
        adminUsers: "admin-users.html",
        adminOrders: "admin-orders.html",
        adminMaterials: "admin-materials.html",
        adminCms: "admin-cms.html",
        pagesIndex: "pages/index.html",
        pagesServices: "pages/services.html",
        pagesMaterials: "pages/materials.html",
        pagesHowItWorks: "pages/how-it-works.html",
        pagesGallery: "pages/gallery.html",
        pagesContacts: "pages/contacts.html"
      }
    }
  }
});
