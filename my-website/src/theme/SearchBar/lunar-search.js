import lunr from "@generated/lunr.client";
lunr.tokenizer.separator = /[\s\-/]+/;

class LunrSearchAdapter {
    constructor(searchDocs, searchIndex, baseUrl = '/', maxHits) {
        this.searchDocs = searchDocs;
        this.lunrIndex = lunr.Index.load(searchIndex);
        this.baseUrl = baseUrl;
        this.maxHits = maxHits;

        // try {
        //     if (searchIndex && typeof searchIndex === 'object' && searchIndex.version) {
        //         // Lunr 인덱스의 유효성 검사
        //         if (!searchIndex.pipeline || !Array.isArray(searchIndex.pipeline)) {
        //             console.error('Invalid Lunr index: pipeline is missing or not an array');
        //             this.lunrIndex = null;
        //         } else {
        //             this.lunrIndex = lunr.Index.load(searchIndex);
        //         }
        //     } else {
        //         console.error('Invalid or missing search index');
        //         this.lunrIndex = null;
        //     }
        // } catch (error) {
        //     console.error('Error loading Lunr index:', error);
        //     this.lunrIndex = null;
        // }
    }

    getLunrResult(input) {
        if (!this.lunrIndex) {
            return [];
        }
        return this.lunrIndex.query((query) => {
            const tokens = lunr.tokenizer(input);
            tokens.forEach((token) => {
                const queryString = token.toString();
                query.term(queryString, {
                    boost: 10
                });
                query.term(queryString, {
                    wildcard: lunr.Query.wildcard.TRAILING
                });
            });
        });
    }

    getHit(doc, formattedTitle, formattedContent) {
        return {
            hierarchy: {
                lvl0: doc.pageTitle || doc.title,
                lvl1: doc.type === 0 ? null : doc.title
            },
            url: doc.url,
            version: doc.version,
            system: doc.url.split('/')[1] || 'General', // 시스템 이름 추가
            _snippetResult: formattedContent ? {
                content: {
                    value: formattedContent,
                    matchLevel: "full"
                }
            } : null,
            _highlightResult: {
                hierarchy: {
                    lvl0: {
                        value: doc.type === 0 ? formattedTitle || doc.title : doc.pageTitle,
                    },
                    lvl1:
                        doc.type === 0
                            ? null
                            : {
                                value: formattedTitle || doc.title
                            }
                }
            }
        };
    }

    getTitleHit(doc, position, length) {
        const start = position[0];
        const end = position[0] + length;
        let formattedTitle = doc.title.substring(0, start) + '<span class="algolia-docsearch-suggestion--highlight">' + doc.title.substring(start, end) + '</span>' + doc.title.substring(end, doc.title.length);
        return this.getHit(doc, formattedTitle)
    }

    getKeywordHit(doc, position, length) {
        const start = position[0];
        const end = position[0] + length;
        let formattedTitle = doc.title + '<br /><i>Keywords: ' + doc.keywords.substring(0, start) + '<span class="algolia-docsearch-suggestion--highlight">' + doc.keywords.substring(start, end) + '</span>' + doc.keywords.substring(end, doc.keywords.length) + '</i>'
        return this.getHit(doc, formattedTitle)
    }

    getContentHit(doc, position) {
        const start = position[0];
        const end = position[0] + position[1];
        let previewStart = start;
        let previewEnd = end;
        let ellipsesBefore = true;
        let ellipsesAfter = true;
        for (let k = 0; k < 3; k++) {
            const nextSpace = doc.content.lastIndexOf(' ', previewStart - 2);
            const nextDot = doc.content.lastIndexOf('.', previewStart - 2);
            if ((nextDot > 0) && (nextDot > nextSpace)) {
                previewStart = nextDot + 1;
                ellipsesBefore = false;
                break;
            }
            if (nextSpace < 0) {
                previewStart = 0;
                ellipsesBefore = false;
                break;
            }
            previewStart = nextSpace + 1;
        }
        for (let k = 0; k < 10; k++) {
            const nextSpace = doc.content.indexOf(' ', previewEnd + 1);
            const nextDot = doc.content.indexOf('.', previewEnd + 1);
            if ((nextDot > 0) && (nextDot < nextSpace)) {
                previewEnd = nextDot;
                ellipsesAfter = false;
                break;
            }
            if (nextSpace < 0) {
                previewEnd = doc.content.length;
                ellipsesAfter = false;
                break;
            }
            previewEnd = nextSpace;
        }
        let preview = doc.content.substring(previewStart, start);
        if (ellipsesBefore) {
            preview = '... ' + preview;
        }
        preview += '<span class="algolia-docsearch-suggestion--highlight">' + doc.content.substring(start, end) + '</span>';
        preview += doc.content.substring(end, previewEnd);
        if (ellipsesAfter) {
            preview += ' ...';
        }
        return this.getHit(doc, null, preview);
    }

    search(input) {
        return new Promise((resolve, rej) => {
            const results = this.getLunrResult(input);
            const hitsPerSystem = {};
            const hits = [];

            results.forEach(result => {
                const doc = this.searchDocs[result.ref];
                const system = doc.url.split('/')[1] || 'General';

                if (!hitsPerSystem[system]) {
                    hitsPerSystem[system] = [];
                }

                if (hitsPerSystem[system].length < 3) {
                    const { metadata } = result.matchData;
                    for (let i in metadata) {
                        if (metadata[i].title) {
                            const position = metadata[i].title.position[0];
                            hits.push(this.getTitleHit(doc, position, input.length));
                            hitsPerSystem[system].push(doc);
                            break;
                        } else if (metadata[i].content) {
                            const position = metadata[i].content.position[0];
                            hits.push(this.getContentHit(doc, position));
                            hitsPerSystem[system].push(doc);
                            break;
                        } else if (metadata[i].keywords) {
                            const position = metadata[i].keywords.position[0];
                            hits.push(this.getKeywordHit(doc, position, input.length));
                            hitsPerSystem[system].push(doc);
                            break;
                        }
                    }
                }

                if (Object.values(hitsPerSystem).flat().length >= this.maxHits) {
                    return false; // break the forEach loop
                }
            });

            resolve(hits);
        });
    }

    searchAll(input) {
        return new Promise((resolve, rej) => {

            console.log('searchAll===================');
            try {
                const results = this.getLunrResult(input);
                console.log(results);
                const hits = [];
        
                results.forEach(result => {
                    const doc = this.searchDocs[result.ref];
                    console.log(doc);
                    const { metadata } = result.matchData;
                    
                    for (let i in metadata) {
                        if (metadata[i].title) {
                            const position = metadata[i].title.position[0];
                            hits.push(this.getTitleHit(doc, position, input.length));
                            break;
                        } else if (metadata[i].content) {
                            const position = metadata[i].content.position[0];
                            hits.push(this.getContentHit(doc, position));
                            break;
                        } else if (metadata[i].keywords) {
                            const position = metadata[i].keywords.position[0];
                            hits.push(this.getKeywordHit(doc, position, input.length));
                            break;
                        }
                    }
                });
        
                resolve(hits);
            }catch (error) {
                console.error('Search error:', error);
                resolve([]);
            }
        });
    }


    searchInstance(query, startIndex = 0, limit = 20) {
        return new Promise((resolve) => {
            if (!this.lunrIndex) {
                resolve({ results: [], hasMore: false });
                return;
            }
          const results = this.lunrIndex.query((lunrQuery) => {
            const tokens = lunr.tokenizer(query);
            tokens.forEach((token) => {
              const tokenString = token.toString();
              lunrQuery.term(tokenString, {
                boost: 10
              });
              lunrQuery.term(tokenString, {
                wildcard: lunr.Query.wildcard.TRAILING
              });
            });
          });
    
          const searchResults = results
            .slice(startIndex, startIndex + limit)
            .map((result) => {
              const doc = this.searchDocs[result.ref];
              return {
                id: result.ref,
                score: result.score,
                title: doc.title,
                url: doc.url,
                content: this.getSnippet(doc.content, query),
                // 필요한 경우 추가 필드
              };
            });
    
          resolve({
            results: searchResults,
            hasMore: results.length > startIndex + limit
          });
        });
      }
    
      getSnippet(content, query, snippetLength = 150) {
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        if (index === -1) {
          return content.slice(0, snippetLength) + "...";
        }
        const start = Math.max(0, index - snippetLength / 2);
        const end = Math.min(content.length, index + snippetLength / 2);
        return (start > 0 ? "..." : "") + content.slice(start, end) + (end < content.length ? "..." : "");
      }
    
}

export default LunrSearchAdapter;