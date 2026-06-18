import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireSalesOperator } from "../middlewares/authz.middleware.js";
import { productService } from "../services/product.service.js";
import { saleService } from "../services/sale.service.js";
import { validateIsActive } from "../validators/sales/product.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/sales/categories",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.user?.role === "ADMINISTRADOR" && req.query.includeInactive === "true";
    const result = await productService.listCategories(includeInactive);
    res.status(200).json(result);
  }),
);

router.post(
  "/sales/categories",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.createCategory(req.body ?? {});
    res.status(201).json(result);
  }),
);

router.patch(
  "/sales/categories/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.updateCategory(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

router.patch(
  "/sales/categories/:id/status",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await productService.updateCategoryStatus(getRouteId(req.params.id), isActive);
    res.status(200).json(result);
  }),
);

router.get(
  "/sales/products",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.listProducts(req.query as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

router.post(
  "/sales/products",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.createProduct(req.body ?? {});
    res.status(201).json(result);
  }),
);

router.patch(
  "/sales/products/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.updateProduct(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

router.patch(
  "/sales/products/:id/status",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await productService.updateProductStatus(getRouteId(req.params.id), isActive);
    res.status(200).json(result);
  }),
);

router.get(
  "/sales/fiados",
  requireSalesOperator,
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await saleService.listFiados();
    res.status(200).json(result);
  }),
);

router.get(
  "/sales",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.listSales(req.query as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

router.get(
  "/sales/:id",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.getSale(getRouteId(req.params.id));
    res.status(200).json(result);
  }),
);

router.post(
  "/sales",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.createSale(req.body ?? {}, req.user!);
    res.status(201).json(result);
  }),
);

router.post(
  "/sales/:id/payments",
  requireSalesOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.receivePayment(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

router.patch(
  "/sales/:id/cancel",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.cancelSale(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

export default router;
