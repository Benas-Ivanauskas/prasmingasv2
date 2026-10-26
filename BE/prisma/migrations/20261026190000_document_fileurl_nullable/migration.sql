-- Document.fileUrl -> nullable. PDF priedai (sąskaita/sutartis) visada
-- generuojami on-demand, niekada necache'inami/neupload'inami į blob
-- storage'ą — Document įrašas naudojamas tik sąskaitos numerio sekimui.
ALTER TABLE "Document" ALTER COLUMN "fileUrl" DROP NOT NULL;
