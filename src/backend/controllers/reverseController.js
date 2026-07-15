const Product = require('../models/Product');
const ReverseLogistics = require('../models/ReverseLogistics');

// Funções auxiliares para mapear os campos do formulário frontend para o esquema MongoDB
const mapReasonToIssueType = (reason) => {
    if (reason && (reason.includes('Vencimento') || reason.includes('Vencido'))) return 'Vencido';
    if (reason && (reason.includes('Defeito') || reason.includes('Técnico') || reason.includes('Defeituoso'))) return 'Defeituoso';
    return 'Avariado';
};

const mapDestinationToStatus = (destination) => {
    if (destination && destination.includes('Reciclagem')) return 'Reciclagem';
    if (destination && (destination.includes('Doação') || destination.includes('Alimentos') || destination.includes('Reuso') || destination.includes('Reaproveitamento'))) return 'Reaproveitamento';
    if (destination && (destination.includes('Fabricante') || destination.includes('Incineração') || destination.includes('Descarte'))) return 'Descarte Sustentável';
    return 'Pendente';
};

/**
 * ♻️ BUSCAR MÉTRICAS E ITENS DA LOGÍSTICA REVERSA / ESG
 * GET -> /api/reverse/analytics
 */
exports.getReverseAnalytics = async (req, res) => {
    try {
        const userCompany = req.user.company;

        // Busca do MongoDB todos os registros vinculados à empresa autenticada
        const companyReturns = await ReverseLogistics.find({ company: userCompany }).sort({ createdAt: -1 });

        // Cálculos de Indicadores ESG baseados nos retornos reais
        let totalWeightRecycled = 0; // em kg
        let co2Mitigated = 0; // em kg de CO2
        let totalItemsProcessed = 0;

        companyReturns.forEach(item => {
            totalItemsProcessed += item.quantity;
            totalWeightRecycled += (item.quantity * 0.5); // Peso médio didático: 500g por item
        });

        // Fórmula ecológica didática: Cada kg reciclado evita 2.5kg de emissão de CO2 na atmosfera
        co2Mitigated = parseFloat((totalWeightRecycled * 2.5).toFixed(2));

        // Mapeia os dados do banco de volta para o formato esperado pelo frontend da tabela
        const mappedReturns = companyReturns.map(item => {
            let reason = item.issueType;
            if (item.issueType === 'Vencido') reason = 'Vencimento Crítico (ESG)';
            else if (item.issueType === 'Defeituoso') reason = 'Avaria / Defeito Técnico';
            else if (item.issueType === 'Avariado') reason = 'Avaria / Defeito Técnico';

            let destination = item.destinationStatus;
            if (item.destinationStatus === 'Reciclagem') destination = 'Centro de Reciclagem Homologado';
            else if (item.destinationStatus === 'Reaproveitamento') destination = 'Doação / Banco de Alimentos';
            else if (item.destinationStatus === 'Descarte Sustentável') destination = 'Logística Reversa p/ Fabricante';

            return {
                _id: item._id,
                productName: item.productName,
                quantity: item.quantity,
                reason: reason,
                destination: destination,
                processedAt: new Date(item.createdAt).toLocaleDateString('pt-BR')
            };
        });

        return res.status(200).json({
            metrics: {
                totalItemsProcessed,
                totalWeightRecycled: Math.ceil(totalWeightRecycled),
                co2Mitigated
            },
            items: mappedReturns
        });
    } catch (error) {
        console.error('[Controller Reverse - Analytics Error]:', error.message);
        return res.status(500).json({ message: 'Erro ao consolidar balanço ESG.', error: error.message });
    }
};

/**
 * 📥 REGISTRAR RETORNO DE MATERIAL (POST -> /api/reverse/return)
 */
exports.registerReturnItem = async (req, res) => {
    try {
        const { productName, quantity, reason, destination } = req.body;

        if (!productName || !quantity || !reason || !destination) {
            return res.status(400).json({ message: 'Todos os campos ecológicos são obrigatórios.' });
        }

        // Recupera o produto para vincular o ID e o SKU de forma estruturada no banco
        const product = await Product.findOne({ name: productName, company: req.user.company });
        if (!product) {
            return res.status(404).json({ message: 'Produto associado não foi localizado no inventário.' });
        }

        // Mapeia os dados do form para os enums estritos do banco de dados
        const issueType = mapReasonToIssueType(reason);
        const destinationStatus = mapDestinationToStatus(destination);

        // Cria o registro persistente no MongoDB
        const newReturn = await ReverseLogistics.create({
            company: req.user.company,
            product: product._id,
            productName: product.name,
            sku: product.sku || '',
            lote: `LOTE-REC-${Date.now()}`, // Lote auto-gerado para rastreabilidade
            quantity: parseInt(quantity, 10),
            issueType,
            destinationStatus,
            observations: `Motivo original: ${reason}. Destino original: ${destination}.`
        });

        // Regra de Negócio WMS Reativa: decrementa do estoque comercial
        product.quantityInStock -= parseInt(quantity, 10);
        if (product.quantityInStock < 0) product.quantityInStock = 0;
        await product.save();

        // Retorna o item no formato amigável para o frontend adicionar na tabela reativamente
        const mappedItem = {
            _id: newReturn._id,
            productName: newReturn.productName,
            quantity: newReturn.quantity,
            reason: reason,
            destination: destination,
            processedAt: new Date(newReturn.createdAt).toLocaleDateString('pt-BR')
        };

        return res.status(201).json({
            message: 'Fluxo de Logística Reversa aberto e registrado no balanço ESG!',
            item: mappedItem
        });
    } catch (error) {
        console.error('[Controller Reverse - Register Error]:', error.message);
        return res.status(400).json({ message: error.message });
    }
};