import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import type { Item } from "../../types/item";
import ItemForm from "./ItemForm";

export const EditItemLoader: React.FC<{ onSaved: () => void }> = ({
	onSaved,
}) => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [item, setItem] = useState<Item | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) {
			navigate("/admin", { replace: true });
			return;
		}

		(async () => {
			try {
				const record = await pb.collection("items").getOne<Item>(id);
				// PB zwraca już pełny rekord, w tym:
				// - images: string[] (nazwy plików z pola file[])
				// - name, price, sizes, category, itd.
				setItem(record);
			} catch (error: any) {
				console.error(error);
				alert(
					"Nie można załadować produktu: " + (error?.message || "nieznany błąd")
				);
				navigate("/admin", { replace: true });
			} finally {
				setLoading(false);
			}
		})();
	}, [id, navigate]);

	if (loading) return <p>Ładowanie produktu…</p>;
	if (!item) return <p>Produkt nie znaleziony</p>;

	return (
		<>
			<h1>Edytujesz produkt: {item.name}</h1>
			<ItemForm editingItem={item} onSaved={onSaved} />
		</>
	);
};

export default EditItemLoader;
