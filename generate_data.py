#!/usr/bin/env python3
import json
import os
import uuid
from datetime import datetime, timezone
from collections import defaultdict

def generate_uuid():
    return str(uuid.uuid4())

def get_current_time():
    return datetime.now(timezone.utc).isoformat()

def analyze_images():
    """Analisa as imagens na pasta images e cria grupos e tags coerentes"""
    
    # Mapeamento de imagens para categorias e tags
    image_analysis = {
        'caminhao.jpg': {
            'category': 'Veículos',
            'subcategory': 'Transporte',
            'tags': ['caminhão', 'veículo pesado', 'transporte', 'logística', 'comercial'],
            'description': 'Caminhão de transporte'
        },
        'carro.jpg': {
            'category': 'Veículos',
            'subcategory': 'Automóveis',
            'tags': ['carro', 'automóvel', 'veículo', 'transporte pessoal', 'mobilidade'],
            'description': 'Automóvel de passeio'
        },
        'moto.jpg': {
            'category': 'Veículos',
            'subcategory': 'Motocicletas',
            'tags': ['moto', 'motocicleta', 'veículo', 'duas rodas', 'mobilidade urbana'],
            'description': 'Motocicleta'
        },
        'cat.jpg': {
            'category': 'Animais',
            'subcategory': 'Domésticos',
            'tags': ['gato', 'felino', 'animal doméstico', 'pet', 'mascote', 'fofo'],
            'description': 'Gato doméstico'
        },
        'tiger.jpg': {
            'category': 'Animais',
            'subcategory': 'Selvagens',
            'tags': ['tigre', 'felino selvagem', 'predador', 'animal grande', 'selva', 'perigoso'],
            'description': 'Tigre selvagem'
        },
        'deer.jpg': {
            'category': 'Animais',
            'subcategory': 'Selvagens',
            'tags': ['veado', 'cervo', 'animal selvagem', 'floresta', 'herbívoro', 'natureza'],
            'description': 'Veado na natureza'
        },
        'squirrel.jpg': {
            'category': 'Animais',
            'subcategory': 'Pequenos',
            'tags': ['esquilo', 'roedor', 'animal pequeno', 'árvore', 'fofo', 'ágil'],
            'description': 'Esquilo em árvore'
        },
        'lago.jpg': {
            'category': 'Natureza',
            'subcategory': 'Água',
            'tags': ['lago', 'água', 'natureza', 'paisagem', 'tranquilo', 'reflexo'],
            'description': 'Lago natural'
        },
        'montanha.jpg': {
            'category': 'Natureza',
            'subcategory': 'Montanhas',
            'tags': ['montanha', 'pico', 'natureza', 'paisagem', 'elevado', 'vista'],
            'description': 'Paisagem de montanha'
        },
        'praia.jpg': {
            'category': 'Natureza',
            'subcategory': 'Costas',
            'tags': ['praia', 'mar', 'areia', 'natureza', 'relaxante', 'verão'],
            'description': 'Praia com mar'
        }
    }
    
    return image_analysis

def create_data_structure():
    """Cria a estrutura de dados baseada nas imagens analisadas"""
    
    image_analysis = analyze_images()
    
    # Criar grupos baseados nas categorias
    groups = {}
    group_categories = defaultdict(list)
    
    for filename, data in image_analysis.items():
        category = data['category']
        subcategory = data['subcategory']
        group_key = f"{category} - {subcategory}"
        
        if group_key not in group_categories:
            group_categories[group_key] = {
                'id': generate_uuid(),
                'name': group_key,
                'description': f"Imagens relacionadas a {category.lower()} e {subcategory.lower()}",
                'created_at': get_current_time(),
                'created_by': 'admin',
                'members': ['admin', 'alice', 'bob', 'charlie', 'diana']
            }
    
    # Converter para o formato final
    for group_data in group_categories.values():
        groups[group_data['id']] = group_data
    
    # Criar imagens
    images = {}
    for filename, data in image_analysis.items():
        # Encontrar o grupo correspondente
        group_id = None
        for group in groups.values():
            if data['category'] in group['name'] and data['subcategory'] in group['name']:
                group_id = group['id']
                break
        
        if group_id:
            image_id = generate_uuid()
            images[image_id] = {
                'id': image_id,
                'filename': filename,
                'original_name': filename,
                'group_id': group_id,
                'uploaded_at': get_current_time(),
                'uploaded_by': 'admin'
            }
    
    # Criar tags aprovadas baseadas nas tags das imagens
    approved_tags = {}
    tag_suggestions = {}
    tag_upvotes = {}
    
    tag_id_counter = 1
    suggestion_id_counter = 1
    upvote_id_counter = 1
    
    for image_id, image in images.items():
        filename = image['filename']
        if filename in image_analysis:
            tags = image_analysis[filename]['tags']
            
            for i, tag in enumerate(tags):
                # Criar tag aprovada
                tag_id = f"tag-{tag_id_counter:03d}"
                approved_tags[tag_id] = {
                    'id': tag_id,
                    'image_id': image_id,
                    'tag': tag,
                    'approved_by': 'admin',
                    'approved_at': get_current_time(),
                    'upvotes': i + 1  # Simular alguns upvotes
                }
                tag_id_counter += 1
                
                # Criar algumas sugestões pendentes
                if i < 2:  # Apenas para as primeiras 2 tags
                    suggestion_id = f"sug-{suggestion_id_counter:03d}"
                    tag_suggestions[suggestion_id] = {
                        'id': suggestion_id,
                        'image_id': image_id,
                        'tag': f"sugestão para {tag}",
                        'suggested_by': 'alice' if i == 0 else 'bob',
                        'suggested_at': get_current_time(),
                        'status': 'pending',
                        'reviewed_by': None,
                        'reviewed_at': None
                    }
                    suggestion_id_counter += 1
                
                # Criar alguns upvotes
                for j in range(min(i + 1, 3)):  # Até 3 upvotes por tag
                    upvote_id = f"upvote-{upvote_id_counter:03d}"
                    upvote_users = ['alice', 'bob', 'charlie', 'diana']
                    tag_upvotes[upvote_id] = {
                        'id': upvote_id,
                        'tag_id': tag_id,
                        'user_id': upvote_users[j % len(upvote_users)],
                        'upvoted_at': get_current_time()
                    }
                    upvote_id_counter += 1
    
    return {
        'groups': groups,
        'images': images,
        'tag_suggestions': tag_suggestions,
        'approved_tags': approved_tags,
        'tag_upvotes': tag_upvotes
    }

def main():
    """Função principal que gera o data.json"""
    print("🔄 Analisando imagens e gerando data.json...")
    
    data = create_data_structure()
    
    # Salvar no arquivo data.json
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("✅ data.json gerado com sucesso!")
    print(f"📊 Estatísticas:")
    print(f"   - Grupos: {len(data['groups'])}")
    print(f"   - Imagens: {len(data['images'])}")
    print(f"   - Tags aprovadas: {len(data['approved_tags'])}")
    print(f"   - Sugestões de tags: {len(data['tag_suggestions'])}")
    print(f"   - Upvotes: {len(data['tag_upvotes'])}")
    
    # Mostrar grupos criados
    print("\n📁 Grupos criados:")
    for group in data['groups'].values():
        print(f"   - {group['name']}: {group['description']}")
    
    # Mostrar algumas tags por categoria
    print("\n🏷️  Tags por categoria:")
    categories = defaultdict(list)
    for tag in data['approved_tags'].values():
        # Encontrar categoria da imagem
        image_id = tag['image_id']
        for img in data['images'].values():
            if img['id'] == image_id:
                filename = img['filename']
                if 'veiculo' in filename.lower() or 'carro' in filename.lower() or 'moto' in filename.lower():
                    categories['Veículos'].append(tag['tag'])
                elif 'animal' in filename.lower() or 'cat' in filename.lower() or 'tiger' in filename.lower():
                    categories['Animais'].append(tag['tag'])
                elif 'natureza' in filename.lower() or 'lago' in filename.lower() or 'montanha' in filename.lower():
                    categories['Natureza'].append(tag['tag'])
                break
    
    for category, tags in categories.items():
        print(f"   - {category}: {', '.join(tags[:5])}...")

if __name__ == "__main__":
    main()
