<script setup lang="ts">
import type { ProductDto } from "#shared/types/pos";
definePageMeta({ middleware: "auth" });
const defaultCategories = ["ดงบุริ", "แกงกะหรี่ญี่ปุ่น", "เส้น", "ของกินเล่น", "ข้าวปั้น", "ซูชิ"];
const { data: categoryRows, refresh: refreshCategories } = await useFetch<Array<{ id: string; name: string }>>(
  "/api/product-categories",
  { default: () => [] },
);
const menuCategories = computed(() => categoryRows.value.length ? categoryRows.value.map(item => item.name) : defaultCategories);
const newCategory = ref("");
const categoryMessage = ref("");
const showCategoryCreate = ref(false);
const showCategoryTable = ref(false);
const showProductCreate = ref(false);
const editingCategoryId = ref("");
const editingCategoryName = ref("");
const empty = () => ({
  name: "",
  category: menuCategories.value[0] || "ดงบุริ",
  description: "",
  price: 10,
  stock: 0,
  minimumStock: 0,
  tag: "",
  imageUrl: null as string | null,
});
const form = reactive(empty());
const message = ref("");
const editingId = ref("");
const uploading = ref("");
const { data: products, refresh } = await useFetch<ProductDto[]>(
  "/api/products?all=1",
  { default: () => [] },
);
async function createProductCategory() {
  categoryMessage.value = "";
  const name = newCategory.value.trim();
  if (!name) return;
  try {
    await $fetch("/api/product-categories", { method: "POST", body: { name } });
    await refreshCategories();
    form.category = name;
    newCategory.value = "";
    categoryMessage.value = "เพิ่มประเภทสินค้าแล้ว";
  } catch (e: any) {
    categoryMessage.value = e?.data?.statusMessage || "เพิ่มประเภทสินค้าไม่สำเร็จ";
  }
}
function startCategoryEdit(category: { id: string; name: string }) {
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
  categoryMessage.value = "";
}
async function saveCategory(category: { id: string; name: string }) {
  categoryMessage.value = "";
  const name = editingCategoryName.value.trim();
  if (!name) return;
  try {
    await $fetch(`/api/product-categories/${category.id}`, { method: "PATCH", body: { name } });
    editingCategoryId.value = "";
    await Promise.all([refreshCategories(), refresh()]);
    if (form.category === category.name) form.category = name;
    categoryMessage.value = "แก้ไขประเภทสินค้าแล้ว";
  } catch (e: any) {
    categoryMessage.value = e?.data?.statusMessage || "แก้ไขประเภทสินค้าไม่สำเร็จ";
  }
}
async function removeCategory(category: { id: string; name: string }) {
  if (!confirm(`ลบประเภท “${category.name}” หรือไม่? สินค้าในหมวดนี้จะย้ายไป “อื่น ๆ”`)) return;
  categoryMessage.value = "";
  try {
    await $fetch(`/api/product-categories/${category.id}`, { method: "DELETE" });
    await Promise.all([refreshCategories(), refresh()]);
    if (form.category === category.name) form.category = "อื่น ๆ";
    categoryMessage.value = "ลบประเภทสินค้าแล้ว";
  } catch (e: any) {
    categoryMessage.value = e?.data?.statusMessage || "ลบประเภทสินค้าไม่สำเร็จ";
  }
}
async function upload(event: Event, target: any, key: string) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = key;
  try {
    const body = new FormData();
    body.append("image", file);
    const result = await $fetch<{ url: string }>("/api/uploads/image", {
      method: "POST",
      body,
    });
    target.imageUrl = result.url;
    if (key !== "new") await update(target);
  } finally {
    uploading.value = "";
  }
}
async function create() {
  message.value = "";
  try {
    await $fetch("/api/products", { method: "POST", body: form });
    Object.assign(form, empty());
    await refresh();
  } catch (e: any) {
    message.value = e?.data?.statusMessage || "บันทึกไม่สำเร็จ";
  }
}
async function update(product: any, values?: Record<string, unknown>) {
  const body = values || {
    name: product.name,
    category: product.category,
    description: product.description,
    price: Number(product.price),
    stock: Number(product.stock),
    minimumStock: Number(product.minimumStock),
    tag: product.tag,
    imageUrl: product.imageUrl,
    active: product.active,
  };
  await $fetch(`/api/products/${product.id}`, { method: "PATCH", body });
  editingId.value = "";
  await refresh();
}
</script>
<template>
  <div>
    <AppNav />
    <main class="admin-page">
      <div class="page-title">
        <div>
          <p class="eyebrow">Catalog</p>
          <h1>สินค้าและรูปภาพ</h1>
        </div>
        <div class="product-page-actions">
          <button type="button" :class="{ active: showCategoryCreate }" @click="showCategoryCreate = !showCategoryCreate">เพิ่มประเภทสินค้า</button>
          <button type="button" :class="{ active: showCategoryTable }" @click="showCategoryTable = !showCategoryTable; if (!showCategoryTable) editingCategoryId = ''">แก้ไขประเภทสินค้า</button>
          <button type="button" :class="{ active: showProductCreate }" @click="showProductCreate = !showProductCreate">เพิ่มสินค้า</button>
        </div>
      </div>
      <section v-if="showCategoryCreate || showCategoryTable" class="panel category-manager">
        <h2>จัดการประเภทสินค้า</h2>
        <form v-if="showCategoryCreate" class="category-create-form" @submit.prevent="createProductCategory">
          <label>สร้างประเภทสินค้าใหม่<input v-model="newCategory" maxlength="100" placeholder="เช่น เครื่องดื่ม" required></label>
          <button>เพิ่มประเภท</button>
          <p v-if="categoryMessage" class="category-message">{{ categoryMessage }}</p>
        </form>
        <div v-if="showCategoryTable" class="category-table-wrap">
          <table class="category-table">
            <thead><tr><th>ลำดับ</th><th>ประเภทสินค้า</th><th>จัดการ</th></tr></thead>
            <tbody>
              <tr v-for="(category, index) in categoryRows" :key="category.id">
                <td>{{ index + 1 }}</td>
                <td><input v-if="editingCategoryId === category.id" v-model="editingCategoryName" maxlength="100" @keyup.enter="saveCategory(category)"><strong v-else>{{ category.name }}</strong></td>
                <td class="category-actions">
                  <template v-if="editingCategoryId === category.id">
                    <button type="button" @click="saveCategory(category)">บันทึก</button>
                    <button type="button" class="secondary" @click="editingCategoryId = ''">ยกเลิก</button>
                  </template>
                  <template v-else>
                    <button type="button" class="secondary" @click="startCategoryEdit(category)">แก้ไข</button>
                    <button v-if="category.name !== 'อื่น ๆ'" type="button" class="category-delete" @click="removeCategory(category)">ลบ</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <form v-if="showProductCreate" class="panel form-row" @submit.prevent="create">
        <label
          >รูปสินค้า<input
            type="file"
            accept="image/*"
            @change="upload($event, form, 'new')" /></label
        ><img
          v-if="form.imageUrl"
          :src="form.imageUrl"
          class="product-thumb"
        /><label>ชื่อสินค้า<input v-model="form.name" required /></label
        ><label>ประเภทเมนู<select v-model="form.category" required><option v-for="item in menuCategories" :key="item" :value="item">{{ item }}</option></select></label
        ><label>รายละเอียด<input v-model="form.description" /></label
        ><label
          >ราคา<input
            v-model.number="form.price"
            type="number"
            min="0"
            required /></label
        ><label
          >สต็อก<input
            v-model.number="form.stock"
            type="number"
            min="0"
            required /></label
        ><label
          >สต็อกขั้นต่ำ<input
            v-model.number="form.minimumStock"
            type="number"
            min="0"
            required /></label
        ><label>ป้าย<select v-model="form.tag">
          <option value="">ไม่แสดงป้าย</option>
          <option value="เมนูแนะนำ">เมนูแนะนำ</option>
          <option value="ขายดี">ขายดี</option>
        </select></label
        ><button :disabled="uploading === 'new'">เพิ่มสินค้า</button>
        <p v-if="message" class="error">{{ message }}</p>
      </form>
      <div class="panel table-wrap">
        <table class="products-table">
          <thead>
            <tr>
              <th>รูป</th>
              <th>ประเภทเมนู</th>
              <th>สินค้า</th>
              <th>รายละเอียด</th>
              <th>ราคา</th>
              <th>สต็อก</th>
              <th>ขั้นต่ำ</th>
              <th>ป้าย</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" :class="{ 'low-stock-row': product.stock <= product.minimumStock }">
              <td>
                <label class="avatar-picker"
                  v-if="editingId === product.id"
                  ><img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    class="product-thumb" /><span
                    v-else
                    class="product-thumb placeholder"
                    >🍣</span
                  ><input
                    type="file"
                    accept="image/*"
                    @change="upload($event, product, product.id)"
                /></label><img
                  v-else-if="product.imageUrl"
                  :src="product.imageUrl"
                  class="product-thumb"
                  :alt="product.name"
                ><span v-else class="product-thumb placeholder">🍣</span>
              </td>
              <td><select v-if="editingId === product.id" v-model="product.category"><option v-for="item in menuCategories" :key="item" :value="item">{{ item }}</option></select><span v-else>{{ product.category }}</span></td>
              <td>
                <input
                  v-if="editingId === product.id"
                  v-model="product.name"
                /><strong v-else>{{ product.name }} <span v-if="product.stock <= product.minimumStock" class="stock-alert">⚠ ใกล้หมด</span></strong>
              </td>
              <td>
                <input
                  v-if="editingId === product.id"
                  v-model="product.description"
                /><span v-else>{{ product.description }}</span>
              </td>
              <td>
                <input
                  v-if="editingId === product.id"
                  v-model.number="product.price"
                  class="small-input"
                  type="number"
                  min="0"
                /><span v-else>{{ product.price }} ฿</span>
              </td>
              <td>
                <input
                  v-if="editingId === product.id"
                  v-model.number="product.stock"
                  class="small-input"
                  type="number"
                  min="0"
                /><span v-else>{{ product.stock }}</span>
              </td>
              <td>
                <input
                  v-if="editingId === product.id"
                  v-model.number="product.minimumStock"
                  class="small-input"
                  type="number"
                  min="0"
                /><span v-else>{{ product.minimumStock }}</span>
              </td>
              <td>
                <select
                  v-if="editingId === product.id"
                  v-model="product.tag"
                >
                  <option :value="null">ไม่แสดงป้าย</option>
                  <option value="เมนูแนะนำ">เมนูแนะนำ</option>
                  <option value="ขายดี">ขายดี</option>
                </select><span v-else>{{ product.tag || "-" }}</span>
              </td>
              <td>
                {{
                  product.active
                    ? product.stock === 0
                      ? "สินค้าหมด"
                      : product.stock <= product.minimumStock
                        ? "ใกล้หมด"
                        : "พร้อมขาย"
                    : "ปิดขาย"
                }}
              </td>
              <td>
                <button
                  v-if="editingId !== product.id"
                  class="secondary"
                  @click="editingId = product.id"
                >
                  แก้ไข</button
                ><button v-else @click="update(product)">บันทึก</button>
                <button
                  class="secondary"
                  @click="update(product, { active: !product.active })"
                >
                  {{ product.active ? "ปิดขาย" : "เปิดขาย" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
