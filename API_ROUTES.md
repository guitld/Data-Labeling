# 🚀 API Routes - RESTful Design

## 📋 Rotas de Grupos (RESTful)

### ✅ **Novas Rotas RESTful**

| Método | Rota | Descrição | Exemplo |
|--------|------|-----------|---------|
| `GET` | `/groups` | Listar todos os grupos | `GET /groups` |
| `POST` | `/groups` | Criar novo grupo | `POST /groups` |
| `GET` | `/groups/{id}` | Buscar grupo específico | `GET /groups/123` |
| `PUT` | `/groups/{id}` | Atualizar grupo | `PUT /groups/123` |
| `DELETE` | `/groups/{id}` | Deletar grupo | `DELETE /groups/123` |
| `POST` | `/groups/{id}/members` | Adicionar membro ao grupo | `POST /groups/123/members` |
| `DELETE` | `/groups/{id}/members/{username}` | Remover membro do grupo | `DELETE /groups/123/members/john` |

### 📝 **Exemplos de Uso**

#### **Criar Grupo**
```bash
POST /groups
Content-Type: application/json

{
  "name": "Marketing Team",
  "description": "Equipe de marketing"
}
```

#### **Atualizar Grupo**
```bash
PUT /groups/123
Content-Type: application/json

{
  "name": "Marketing Team Updated",
  "description": "Nova descrição"
}
```

#### **Adicionar Membro**
```bash
POST /groups/123/members
Content-Type: application/json

{
  "username": "john_doe"
}
```

#### **Remover Membro**
```bash
DELETE /groups/123/members/john_doe
```

### ⚠️ **Rotas Legacy (Deprecated)**

As seguintes rotas ainda funcionam para compatibilidade, mas são **deprecated**:

| Método | Rota | Status |
|--------|------|--------|
| `POST` | `/groups/add-user` | ⚠️ Deprecated |
| `POST` | `/groups/remove-user` | ⚠️ Deprecated |
| `POST` | `/groups/update` | ⚠️ Deprecated |
| `POST` | `/groups/delete` | ⚠️ Deprecated |

## 🎯 **Benefícios da Refatoração**

### ✅ **Antes vs Depois**

| Aspecto | Antes (Inconsistente) | Depois (RESTful) |
|---------|----------------------|------------------|
| **Semântica** | ❌ POST para tudo | ✅ Verbos HTTP corretos |
| **URLs** | ❌ `/groups/add-user` | ✅ `/groups/{id}/members` |
| **Identificação** | ❌ ID no body | ✅ ID na URL |
| **Padrão** | ❌ Não segue REST | ✅ Segue REST |
| **Manutenção** | ❌ Difícil | ✅ Fácil |
| **Documentação** | ❌ Confusa | ✅ Auto-explicativa |

### 🚀 **Vantagens**

1. **Manutenibilidade**: Código mais limpo e previsível
2. **Padrão**: Segue convenções REST amplamente aceitas
3. **Clareza**: URLs auto-explicativas
4. **Escalabilidade**: Fácil de estender
5. **Ferramentas**: Melhor suporte de IDEs e documentação
6. **Cache**: HTTP caching funciona melhor
7. **Testes**: Mais fáceis de automatizar

## 📚 **Próximos Passos**

1. ✅ **Implementado**: Rotas RESTful para grupos
2. 🔄 **Em andamento**: Atualizar frontend para usar novas rotas
3. ⏳ **Futuro**: Aplicar mesmo padrão para outras entidades (images, tags, users)
4. ⏳ **Futuro**: Remover rotas legacy após migração completa

## 🔧 **Como Migrar**

### **Frontend (React)**

```typescript
// ❌ Antes
const addUserToGroup = async (groupId: string, username: string) => {
  await api.post('/groups/add-user', { group_id: groupId, username });
};

// ✅ Depois
const addUserToGroup = async (groupId: string, username: string) => {
  await api.post(`/groups/${groupId}/members`, { username });
};
```

### **Curl Examples**

```bash
# ✅ Criar grupo
curl -X POST http://localhost:8082/groups \
  -H "Content-Type: application/json" \
  -d '{"name": "Dev Team", "description": "Development team"}'

# ✅ Buscar grupo
curl -X GET http://localhost:8082/groups/123

# ✅ Atualizar grupo
curl -X PUT http://localhost:8082/groups/123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Dev Team Updated", "description": "Updated description"}'

# ✅ Adicionar membro
curl -X POST http://localhost:8082/groups/123/members \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'

# ✅ Remover membro
curl -X DELETE http://localhost:8082/groups/123/members/john_doe
```

---

**Status**: ✅ **Implementado e Funcional**
**Compatibilidade**: ✅ **Backward Compatible** (rotas legacy mantidas)
**Próximo**: 🔄 **Migrar frontend para novas rotas**
