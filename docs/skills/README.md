# Skills de Claude Code

Skills del proyecto para [Claude Code](https://claude.ai/code). Claude Code las lee de `.claude/skills/`, que está
ignorada por git; esta carpeta guarda la copia versionada.

| Skill | Para qué |
|---|---|
| [agregar-localidad](agregar-localidad/SKILL.md) | Sumar una localidad, zona o área al mapa, o ampliar el área de una existente: datos con fuente, cota del cero, configuración, migración, relieve y verificación. |

Para instalarlas en otra copia del repo:

```bash
mkdir -p .claude/skills && cp -r docs/skills/agregar-localidad .claude/skills/
```

Si se cambia una skill, hay que mantener iguales las dos copias:

```bash
diff -r .claude/skills/agregar-localidad docs/skills/agregar-localidad
```
