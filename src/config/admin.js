import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { Customer, DeliveryPartner, Admin } from "../schemas/user.js";
import Category from "../schemas/category.js";
import Product from "../schemas/products.js";
import Counter from "../schemas/counter.js";
import Branch from "../schemas/branch.js";

AdminJS.registerAdapter(AdminJSMongoose);

const adminJs = new AdminJS({
	resources: [
		{ resource: Customer, options: { navigation: { name: "Users" } } },
		{ resource: DeliveryPartner, options: { navigation: { name: "Users" } } },
		{ resource: Admin, options: { navigation: { name: "Users" } } },
		{ resource: Category, options: { navigation: { name: "Store" } } },
		{ resource: Product, options: { navigation: { name: "Store" } } },
		{ resource: Branch, options: { navigation: { name: "Store" } } },
		{ resource: Counter, options: { navigation: { name: "System" } } },
	],
	branding: {
		companyName: "Grocery App",
		withMadeWithLove: false,
	},
	rootPath: "/admin",
});

const adminRouter = AdminJSExpress.buildRouter(adminJs);

export { adminJs, adminRouter };
